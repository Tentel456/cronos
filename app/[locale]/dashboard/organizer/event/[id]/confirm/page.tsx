"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface Participant {
	id: string;
	participant_id: string;
	participant: {
		first_name: string;
		last_name: string;
		avatar_url: string | null;
	};
	status: string;
	confirmation_code: string;
	points_earned: number;
	confirmed_at: string | null;
}

interface Event {
	id: string;
	title: string;
	points_reward: number;
}

export default function ConfirmAttendancePage() {
	const router = useRouter();
	const params = useParams();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [event, setEvent] = useState<Event | null>(null);
	const [manualCode, setManualCode] = useState('');
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [confirming, setConfirming] = useState<string | null>(null);

	const eventId = params.id as string;

	useEffect(() => {
		checkUser();
	}, []);

	const checkUser = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			router.push(`/${currentLocale}/login`);
			return;
		}

		setUser(user);

		const { data: profile } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		setProfile(profile);

		if (profile?.role !== 'organizer') {
			router.push(`/${currentLocale}/dashboard`);
			return;
		}

		// Load event and participants
		await loadEventData(user.id);

		setLoading(false);
	};

	const loadEventData = async (organizerId: string) => {
		// Load event details
		const { data: eventData, error: eventError } = await supabase
			.from('events')
			.select('id, title, points_reward, organizer_id')
			.eq('id', eventId)
			.single();

		if (eventError) {
			console.error('Error loading event:', eventError);
			return;
		}

		// Check if user is the organizer
		if (eventData.organizer_id !== organizerId) {
			alert('You are not authorized to confirm attendance for this event');
			router.push(`/${currentLocale}/dashboard/organizer`);
			return;
		}

		setEvent(eventData);

		// Load participants
		await loadParticipants();
	};

	const loadParticipants = async () => {
		const { data, error } = await supabase
			.from('event_participants')
			.select(`
				*,
				participant:profiles!participant_id(first_name, last_name, avatar_url)
			`)
			.eq('event_id', eventId)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error loading participants:', error);
			return;
		}

		setParticipants(data || []);
	};

	const confirmByCode = async (code: string) => {
		if (!user || !event) return;

		setConfirming(code);

		try {
			// Find participant by confirmation code
			const participant = participants.find(
				p => p.confirmation_code.toUpperCase() === code.toUpperCase() && p.status === 'registered'
			);

			if (!participant) {
				alert('Invalid code or participant already confirmed');
				return;
			}

			// Update participant status and award points
			const { error: updateError } = await supabase
				.from('event_participants')
				.update({
					status: 'confirmed',
					confirmed_at: new Date().toISOString(),
					confirmed_by: user.id,
					points_earned: event.points_reward
				})
				.eq('id', participant.id);

			if (updateError) throw updateError;

			// Increment events_attended counter
			const { error: counterError } = await supabase.rpc('increment_events_attended', {
				participant_id: participant.participant_id
			});

			if (counterError) console.error('Error updating counter:', counterError);

			alert(`✓ Confirmed! ${participant.participant?.first_name || 'Participant'} earned ${event.points_reward} points`);

			// Reload participants
			await loadParticipants();
		} catch (error: any) {
			console.error('Error confirming:', error);
			alert('Failed to confirm attendance. Please try again.');
		} finally {
			setConfirming(null);
		}
	};

	const confirmManually = async (participantRecordId: string) => {
		if (!user || !event) return;

		setConfirming(participantRecordId);

		try {
			const participant = participants.find(p => p.id === participantRecordId);
			if (!participant) return;

			// Update participant status and award points
			const { error: updateError } = await supabase
				.from('event_participants')
				.update({
					status: 'confirmed',
					confirmed_at: new Date().toISOString(),
					confirmed_by: user.id,
					points_earned: event.points_reward
				})
				.eq('id', participantRecordId);

			if (updateError) throw updateError;

			// Increment events_attended counter
			const { error: counterError } = await supabase.rpc('increment_events_attended', {
				participant_id: participant.participant_id
			});

			if (counterError) console.error('Error updating counter:', counterError);

			// Reload participants
			await loadParticipants();
		} catch (error: any) {
			console.error('Error confirming:', error);
			alert('Failed to confirm attendance. Please try again.');
		} finally {
			setConfirming(null);
		}
	};

	const handleManualCodeSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (manualCode) {
			confirmByCode(manualCode);
			setManualCode('');
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Loading...</div>
			</div>
		);
	}

	const confirmedCount = participants.filter(p => p.status === 'confirmed').length;
	const totalPoints = participants.reduce((sum, p) => sum + (p.points_earned || 0), 0);

	return (
		<div className="min-h-screen bg-[#0f0f0f] text-white">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-24 bg-[#1a1a1a] flex flex-col items-center py-6 space-y-12 z-50">
				<div className="w-16 h-16 flex items-center justify-center">
					<Image src="/logo.svg" alt="Logo" width={64} height={64} />
				</div>
				<div className="flex-1 flex flex-col space-y-6 mt-8">
					<Link href={`/${currentLocale}/dashboard/organizer`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">🏠</span>
						</button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="ml-24 p-8">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<Link href={`/${currentLocale}/dashboard/organizer`}>
						<button className="text-gray-400 hover:text-white transition-colors">
							← Back
						</button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold">Confirm Attendance</h1>
						<p className="text-gray-400 mt-1">{event?.title}</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-8">
					{/* QR Code Scanner */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
						<div className="bg-[#0f0f0f] border border-gray-600 h-64 flex items-center justify-center mb-4">
							<div className="text-center text-gray-400">
								<div className="text-6xl mb-4">📷</div>
								<p>QR Scanner would be here</p>
								<p className="text-sm">(Camera integration required)</p>
							</div>
						</div>

						{/* Manual Code Entry */}
						<form onSubmit={handleManualCodeSubmit}>
							<label className="block text-sm text-gray-400 mb-2">Or enter code manually:</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={manualCode}
									onChange={(e) => setManualCode(e.target.value.toUpperCase())}
									className="flex-1 bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="ABC123"
									disabled={confirming !== null}
								/>
								<button
									type="submit"
									disabled={confirming !== null || !manualCode}
									className="px-6 py-2 bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
								>
									{confirming === manualCode ? 'Confirming...' : 'Confirm'}
								</button>
							</div>
						</form>
					</div>

					{/* Participants List */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<h2 className="text-xl font-semibold mb-4">Participants</h2>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{participants.length > 0 ? (
								participants.map((participant) => (
									<div
										key={participant.id}
										className="bg-[#0f0f0f] border border-gray-600 p-4 flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
												{participant.participant?.avatar_url ? (
													<img
														src={participant.participant.avatar_url}
														alt="Avatar"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-white font-bold">
														{participant.participant?.first_name?.[0]?.toUpperCase() || '?'}
													</span>
												)}
											</div>
											<div>
												<div className="font-semibold">
													{participant.participant?.first_name || 'Unknown'} {participant.participant?.last_name || ''}
												</div>
												<div className="text-sm text-gray-400">
													Code: <span className="font-mono text-purple-400">{participant.confirmation_code}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{participant.status === 'confirmed' ? (
												<div className="text-right">
													<div className="px-3 py-1 border border-green-400 text-green-400 text-sm mb-1">
														✓ Confirmed
													</div>
													<div className="text-xs text-gray-400">
														+{participant.points_earned} points
													</div>
												</div>
											) : (
												<button
													onClick={() => confirmManually(participant.id)}
													disabled={confirming === participant.id}
													className="px-4 py-1 bg-purple-600 hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
												>
													{confirming === participant.id ? 'Confirming...' : 'Confirm'}
												</button>
											)}
										</div>
									</div>
								))
							) : (
								<div className="text-center py-8 text-gray-400">
									<div className="text-4xl mb-2">👥</div>
									<p>No participants yet</p>
								</div>
							)}
						</div>

						{/* Stats */}
						<div className="mt-6 pt-6 border-t border-gray-600">
							<div className="grid grid-cols-3 gap-4">
								<div>
									<div className="text-gray-400 text-sm">Total</div>
									<div className="text-2xl font-bold">{participants.length}</div>
								</div>
								<div>
									<div className="text-gray-400 text-sm">Confirmed</div>
									<div className="text-2xl font-bold text-green-400">{confirmedCount}</div>
								</div>
								<div>
									<div className="text-gray-400 text-sm">Points Awarded</div>
									<div className="text-2xl font-bold text-purple-400">{totalPoints}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
