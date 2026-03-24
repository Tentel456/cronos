"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";

interface Event {
	id: string;
	title: string;
	description: string;
	category: string;
	date: string;
	location: string;
	points_reward: number;
	max_participants: number;
	status: string;
	organizer_id: string;
	organizer: {
		first_name: string;
		last_name: string;
		organization: string;
	};
	participants_count: number;
	is_registered: boolean;
	is_full: boolean;
}

export default function CategoryPage() {
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [registering, setRegistering] = useState<string | null>(null);
	const category = params.slug as string;
	const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

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
		
		// Load events for this category
		await loadEvents(user.id);
		
		setLoading(false);
	};

	const loadEvents = async (userId: string) => {
		// Load events by category
		const { data: eventsData, error } = await supabase
			.from('events')
			.select(`
				*,
				organizer:profiles!organizer_id(first_name, last_name, organization),
				event_participants(participant_id)
			`)
			.eq('category', categoryName)
			.eq('status', 'upcoming')
			.eq('moderation_status', 'approved')
			.order('date', { ascending: true });

		if (error) {
			console.error('Error loading events:', error);
			return;
		}

		// Transform data
		const transformedEvents: Event[] = (eventsData || []).map((event: any) => {
			const participants = event.event_participants || [];
			const participantsCount = participants.length;
			const isRegistered = participants.some((p: any) => p.participant_id === userId);
			const isFull = event.max_participants > 0 && participantsCount >= event.max_participants;

			return {
				id: event.id,
				title: event.title,
				description: event.description || '',
				category: event.category,
				date: event.date,
				location: event.location || '',
				points_reward: event.points_reward || 0,
				max_participants: event.max_participants || 0,
				status: event.status,
				organizer_id: event.organizer_id,
				organizer: event.organizer || { first_name: '', last_name: '', organization: '' },
				participants_count: participantsCount,
				is_registered: isRegistered,
				is_full: isFull
			};
		});

		setEvents(transformedEvents);
	};

	const handleRegister = async (eventId: string) => {
		if (!user) return;

		setRegistering(eventId);

		try {
			// Generate confirmation code
			const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

			// Register for event
			const { error } = await supabase
				.from('event_participants')
				.insert({
					event_id: eventId,
					participant_id: user.id,
					status: 'registered',
					confirmation_code: confirmationCode,
					points_earned: 0
				});

			if (error) {
				if (error.code === '23505') {
					alert('You are already registered for this event!');
				} else {
					throw error;
				}
			} else {
				alert(`Successfully registered! Your confirmation code: ${confirmationCode}`);
				// Reload events to update registration status
				await loadEvents(user.id);
			}
		} catch (error: any) {
			console.error('Error registering:', error);
			alert('Failed to register. Please try again.');
		} finally {
			setRegistering(null);
		}
	};

	const isActive = (path: string) => pathname === `/${currentLocale}${path}`;

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0f0f0f] text-white">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-24 bg-[#1a1a1a] flex flex-col items-center py-6 space-y-12 z-50">
				<div className="w-16 h-16 flex items-center justify-center">
					<Image src="/logo.svg" alt="Logo" width={64} height={64} />
				</div>
				<div className="flex-1 flex flex-col space-y-6 mt-8">
					<Link href={`/${currentLocale}/dashboard`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className={`text-2xl ${isActive('/dashboard') ? 'text-white' : 'text-gray-400'}`}>🏠</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/courses`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className={`text-2xl ${isActive('/dashboard/courses') ? 'text-white' : 'text-gray-400'}`}>📚</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/analytics`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className={`text-2xl ${isActive('/dashboard/analytics') ? 'text-white' : 'text-gray-400'}`}>📊</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/files`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className={`text-2xl ${isActive('/dashboard/files') ? 'text-white' : 'text-gray-400'}`}>📁</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/messages`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className={`text-2xl ${isActive('/dashboard/messages') ? 'text-white' : 'text-gray-400'}`}>💬</span>
						</button>
					</Link>
				</div>
				<Link href={`/${currentLocale}/dashboard/settings`}>
					<button className="w-12 h-12 flex items-center justify-center">
						<span className={`text-2xl ${isActive('/dashboard/settings') ? 'text-white' : 'text-gray-400'}`}>⚙️</span>
					</button>
				</Link>
			</div>

			{/* Main Content */}
			<div className="ml-24 p-8">
				{/* Header with Back Button */}
				<div className="flex items-center gap-4 mb-8">
					<Link href={`/${currentLocale}/dashboard/courses`}>
						<button className="text-gray-400 hover:text-white transition-colors">
							← Back
						</button>
					</Link>
					<h1 className="text-4xl font-bold">{categoryName} Events</h1>
				</div>

				{/* Events Grid */}
				{events.length > 0 ? (
					<div className="grid grid-cols-1 gap-6">
						{events.map((event) => (
							<div
								key={event.id}
								className="bg-[#1a1a1a] border border-gray-600 p-6 hover:bg-[#222] transition-colors"
							>
								<div className="flex gap-6">
									{/* Event Image */}
									<div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
										<span className="text-4xl">📅</span>
									</div>

									{/* Event Details */}
									<div className="flex-1">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="text-2xl font-semibold mb-1">{event.title}</h3>
												<Link href={`/${currentLocale}/organizer/${event.organizer_id}`}>
													<p className="text-purple-400 text-sm hover:text-purple-300 transition-colors cursor-pointer">
														{event.organizer.organization || `${event.organizer.first_name} ${event.organizer.last_name}`}
													</p>
												</Link>
											</div>
											<div className="flex flex-col gap-2 items-end">
												<span className="px-4 py-1.5 border border-green-400 text-green-400 text-sm">
													{event.status.toUpperCase()}
												</span>
												{event.is_full && (
													<span className="px-4 py-1.5 border border-red-400 text-red-400 text-sm">
														FULL
													</span>
												)}
											</div>
										</div>

										<p className="text-gray-300 mb-4">{event.description}</p>

										<div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
											<div className="flex items-center gap-2">
												<span>📅</span>
												<span>{new Date(event.date).toLocaleDateString()}</span>
											</div>
											<div className="flex items-center gap-2">
												<span>📍</span>
												<span>{event.location}</span>
											</div>
											<div className="flex items-center gap-2">
												<span>👥</span>
												<span>{event.participants_count}/{event.max_participants || '∞'}</span>
											</div>
											<div className="flex items-center gap-2">
												<span>🏆</span>
												<span>{event.points_reward} points</span>
											</div>
										</div>

										<div className="flex gap-3">
											{event.is_registered ? (
												<button
													disabled
													className="px-6 py-2 bg-gray-600 cursor-not-allowed"
												>
													✓ Registered
												</button>
											) : event.is_full ? (
												<button
													disabled
													className="px-6 py-2 bg-gray-600 cursor-not-allowed"
												>
													Event Full
												</button>
											) : (
												<button
													onClick={() => handleRegister(event.id)}
													disabled={registering === event.id}
													className="px-6 py-2 bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
												>
													{registering === event.id ? 'Registering...' : 'Register'}
												</button>
											)}
											<Link href={`/${currentLocale}/dashboard/event/${event.id}`}>
												<button className="px-6 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors">
													Learn More
												</button>
											</Link>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-20">
						<div className="text-6xl mb-4">📅</div>
						<p className="text-gray-400 text-xl mb-2">No events found in this category</p>
						<p className="text-gray-500 text-sm">Check back later for new events!</p>
					</div>
				)}
			</div>
		</div>
	);
}
