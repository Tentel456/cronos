"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";

// QR Code component with real qrcode library
const QRCodeDisplay = ({ code }: { code: string }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		const generateQR = async () => {
			if (canvasRef.current) {
				try {
					// Dynamic import to avoid SSR issues
					const QRCode = (await import('qrcode')).default;
					
					await QRCode.toCanvas(canvasRef.current, code, {
						width: 200,
						margin: 2,
						color: {
							dark: '#000000',
							light: '#FFFFFF'
						}
					});
					setError(false);
				} catch (err) {
					console.error('QR Code generation error:', err);
					setError(true);
					
					// Fallback: draw placeholder
					const ctx = canvasRef.current.getContext('2d');
					if (ctx) {
						ctx.fillStyle = '#2a2a2a';
						ctx.fillRect(0, 0, 200, 200);
						ctx.fillStyle = '#fff';
						ctx.font = '12px Arial';
						ctx.textAlign = 'center';
						ctx.fillText('QR Code Error', 100, 90);
						ctx.fillText('Install: npm install', 100, 110);
						ctx.fillText('qrcode @types/qrcode', 100, 130);
					}
				}
			}
		};

		generateQR();
	}, [code]);

	return (
		<div className="flex flex-col items-center">
			<canvas ref={canvasRef} width={200} height={200} className="border border-gray-600" />
			{error && (
				<p className="text-red-400 text-xs mt-2">
					Установите библиотеку: npm install qrcode
				</p>
			)}
		</div>
	);
};

interface MyEvent {
	id: string;
	event: {
		id: string;
		title: string;
		description: string;
		category: string;
		date: string;
		location: string;
		points_reward: number;
	};
	status: string;
	confirmation_code: string;
	points_earned: number;
	confirmed_at: string | null;
}

export default function MyEventsPage() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
	const [filter, setFilter] = useState<'all' | 'registered' | 'confirmed' | 'cancelled'>('all');
	const [showQRModal, setShowQRModal] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);

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
		
		// Load user's events
		await loadMyEvents(user.id);
		
		setLoading(false);
	};

	const loadMyEvents = async (userId: string) => {
		const { data, error } = await supabase
			.from('event_participants')
			.select(`
				*,
				event:events(*)
			`)
			.eq('participant_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error loading events:', error);
			return;
		}

		setMyEvents(data || []);
	};

	const filteredEvents = filter === 'all' 
		? myEvents 
		: myEvents.filter(e => e.status === filter);

	const isActive = (path: string) => pathname === `/${currentLocale}${path}`;

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'registered': return 'border-blue-400 text-blue-400';
			case 'confirmed': return 'border-green-400 text-green-400';
			case 'cancelled': return 'border-red-400 text-red-400';
			default: return 'border-gray-400 text-gray-400';
		}
	};

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
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">My Events</h1>
					<p className="text-gray-400">Track your registered and completed events</p>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-4 gap-4 mb-8">
					<div className="bg-[#1a1a1a] border border-gray-600 p-4">
						<div className="text-gray-400 text-sm mb-1">Total Events</div>
						<div className="text-3xl font-bold">{myEvents.length}</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-4">
						<div className="text-gray-400 text-sm mb-1">Registered</div>
						<div className="text-3xl font-bold text-blue-400">
							{myEvents.filter(e => e.status === 'registered').length}
						</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-4">
						<div className="text-gray-400 text-sm mb-1">Confirmed</div>
						<div className="text-3xl font-bold text-green-400">
							{myEvents.filter(e => e.status === 'confirmed').length}
						</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-4">
						<div className="text-gray-400 text-sm mb-1">Total Points</div>
						<div className="text-3xl font-bold text-purple-400">
							{myEvents.reduce((sum, e) => sum + (e.points_earned || 0), 0)}
						</div>
					</div>
				</div>

				{/* Filter Buttons */}
				<div className="flex gap-3 mb-6">
					<button
						onClick={() => setFilter('all')}
						className={`px-4 py-2 border transition-colors ${
							filter === 'all'
								? 'border-purple-500 bg-purple-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						All
					</button>
					<button
						onClick={() => setFilter('registered')}
						className={`px-4 py-2 border transition-colors ${
							filter === 'registered'
								? 'border-blue-500 bg-blue-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Registered
					</button>
					<button
						onClick={() => setFilter('confirmed')}
						className={`px-4 py-2 border transition-colors ${
							filter === 'confirmed'
								? 'border-green-500 bg-green-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Confirmed
					</button>
					<button
						onClick={() => setFilter('cancelled')}
						className={`px-4 py-2 border transition-colors ${
							filter === 'cancelled'
								? 'border-red-500 bg-red-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Cancelled
					</button>
				</div>

				{/* Events List */}
				{filteredEvents.length > 0 ? (
					<div className="space-y-4">
						{filteredEvents.map((myEvent) => (
							<div
								key={myEvent.id}
								className="bg-[#1a1a1a] border border-gray-600 p-6"
							>
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="text-xl font-semibold mb-1">{myEvent.event.title}</h3>
										<p className="text-gray-400 text-sm">{myEvent.event.category}</p>
									</div>
									<span className={`px-3 py-1 border text-sm ${getStatusColor(myEvent.status)}`}>
										{myEvent.status.toUpperCase()}
									</span>
								</div>

								<p className="text-gray-300 mb-4">{myEvent.event.description}</p>

								<div className="grid grid-cols-2 gap-4 text-sm mb-4">
									<div>
										<div className="text-gray-400 mb-1">Date</div>
										<div>{new Date(myEvent.event.date).toLocaleDateString()}</div>
									</div>
									<div>
										<div className="text-gray-400 mb-1">Location</div>
										<div>{myEvent.event.location}</div>
									</div>
									<div>
										<div className="text-gray-400 mb-1">Confirmation Code</div>
										<div className="font-mono text-purple-400">{myEvent.confirmation_code}</div>
									</div>
									<div>
										<div className="text-gray-400 mb-1">Points</div>
										<div className="text-green-400 font-semibold">
											{myEvent.points_earned > 0 ? `+${myEvent.points_earned}` : myEvent.event.points_reward}
										</div>
									</div>
								</div>

								{myEvent.confirmed_at && (
									<div className="text-sm text-gray-400 mb-4">
										Confirmed on {new Date(myEvent.confirmed_at).toLocaleDateString()}
									</div>
								)}

								{/* QR Code Button */}
								{myEvent.status === 'registered' && (
									<button
										onClick={() => {
											setSelectedEvent(myEvent);
											setShowQRModal(true);
										}}
										className="px-6 py-2 bg-purple-600 hover:bg-purple-700 transition-colors"
									>
										Показать QR-код
									</button>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-20">
						<div className="text-6xl mb-4">📅</div>
						<p className="text-gray-400 text-xl mb-2">No events found</p>
						<Link href={`/${currentLocale}/dashboard/courses`}>
							<button className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors">
								Browse Events
							</button>
						</Link>
					</div>
				)}
			</div>

			{/* QR Code Modal */}
			{showQRModal && selectedEvent && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setShowQRModal(false)}>
					<div className="bg-[#1a1a1a] border border-gray-600 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold">QR-код для подтверждения</h2>
							<button
								onClick={() => setShowQRModal(false)}
								className="text-gray-400 hover:text-white text-2xl"
							>
								×
							</button>
						</div>

						<div className="text-center mb-6">
							<h3 className="text-xl font-semibold mb-2">{selectedEvent.event.title}</h3>
							<p className="text-gray-400 text-sm mb-4">{selectedEvent.event.category}</p>
						</div>

						{/* QR Code */}
						<div className="flex justify-center mb-6">
							<QRCodeDisplay code={selectedEvent.confirmation_code} />
						</div>

						{/* Confirmation Code */}
						<div className="text-center mb-6">
							<div className="text-gray-400 text-sm mb-2">Код подтверждения:</div>
							<div className="text-3xl font-mono font-bold text-purple-400">
								{selectedEvent.confirmation_code}
							</div>
						</div>

						{/* Instructions */}
						<div className="bg-[#0f0f0f] border border-gray-600 p-4 mb-6">
							<p className="text-sm text-gray-300">
								Покажите этот QR-код организатору на мероприятии для подтверждения вашего участия.
							</p>
						</div>

						<button
							onClick={() => setShowQRModal(false)}
							className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors"
						>
							Закрыть
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
