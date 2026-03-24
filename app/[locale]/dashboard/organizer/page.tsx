"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

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
	participants_count: number;
}

export default function OrganizerDashboard() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [events, setEvents] = useState<Event[]>([]);

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

		// Redirect if not organizer
		if (profile?.role !== 'organizer') {
			router.push(`/${currentLocale}/dashboard`);
			return;
		}

		// Load real events from Supabase
		await loadEvents(user.id);

		setLoading(false);
	};

	const loadEvents = async (organizerId: string) => {
		// Load events created by this organizer
		const { data: eventsData, error } = await supabase
			.from('events')
			.select(`
				*,
				event_participants(count)
			`)
			.eq('organizer_id', organizerId)
			.order('date', { ascending: false });

		if (error) {
			console.error('Error loading events:', error);
			return;
		}

		// Transform data to match Event interface
		const transformedEvents: Event[] = (eventsData || []).map((event: any) => ({
			id: event.id,
			title: event.title,
			description: event.description || '',
			category: event.category,
			date: event.date,
			location: event.location || '',
			points_reward: event.points_reward || 0,
			max_participants: event.max_participants || 0,
			status: event.status,
			participants_count: event.event_participants?.[0]?.count || 0
		}));

		setEvents(transformedEvents);
	};

	const isActive = (path: string) => pathname === `/${currentLocale}${path}`;

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Loading...</div>
			</div>
		);
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'upcoming': return 'border-blue-400 text-blue-400';
			case 'ongoing': return 'border-green-400 text-green-400';
			case 'completed': return 'border-gray-400 text-gray-400';
			case 'cancelled': return 'border-red-400 text-red-400';
			default: return 'border-gray-400 text-gray-400';
		}
	};

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
							<span className={`text-2xl ${isActive('/dashboard/organizer') ? 'text-white' : 'text-gray-400'}`}>🏠</span>
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
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold">
							Organizer Dashboard
						</h1>
						<p className="text-gray-400 mt-1">Manage your events and participants</p>
					</div>
					<div className="flex items-center gap-4">
						<Link href={`/${currentLocale}/dashboard/profile`}>
							<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
								{profile?.avatar_url ? (
									<img
										src={profile.avatar_url}
										alt="Avatar"
										className="w-full h-full object-cover"
									/>
								) : (
									<span>{profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span>
								)}
							</div>
						</Link>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-4 gap-4 mb-8">
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 text-sm mb-2">Total Events</div>
						<div className="text-3xl font-bold">{events.length}</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 text-sm mb-2">Upcoming</div>
						<div className="text-3xl font-bold text-blue-400">
							{events.filter(e => e.status === 'upcoming').length}
						</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 text-sm mb-2">Completed</div>
						<div className="text-3xl font-bold text-green-400">
							{events.filter(e => e.status === 'completed').length}
						</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 text-sm mb-2">Total Participants</div>
						<div className="text-3xl font-bold text-purple-400">
							{events.reduce((sum, e) => sum + e.participants_count, 0)}
						</div>
					</div>
				</div>

				{/* Create Event Button */}
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-semibold">My Events</h2>
					<Link href={`/${currentLocale}/dashboard/organizer/create-event`}>
						<button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-2">
							<span>+</span>
							<span>Create New Event</span>
						</button>
					</Link>
				</div>

				{/* Events List */}
				<div className="space-y-4">
					{events.map((event) => (
						<div
							key={event.id}
							className="bg-[#1a1a1a] border border-gray-600 p-6 hover:bg-[#222] transition-colors"
						>
							<div className="flex justify-between items-start mb-4">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-xl font-semibold">{event.title}</h3>
										<span className={`px-3 py-1 border text-xs ${getStatusColor(event.status)}`}>
											{event.status.toUpperCase()}
										</span>
									</div>
									<p className="text-gray-400 mb-3">{event.description}</p>
									<div className="flex items-center gap-6 text-sm text-gray-400">
										<div className="flex items-center gap-2">
											<span>📅</span>
											<span>{new Date(event.date).toLocaleDateString()}</span>
										</div>
										<div className="flex items-center gap-2">
											<span>📍</span>
											<span>{event.location}</span>
										</div>
										<div className="flex items-center gap-2">
											<span>🏆</span>
											<span>{event.points_reward} points</span>
										</div>
										<div className="flex items-center gap-2">
											<span>👥</span>
											<span>{event.participants_count}/{event.max_participants}</span>
										</div>
									</div>
								</div>
							</div>

							<div className="flex gap-3">
								<Link href={`/${currentLocale}/dashboard/organizer/event/${event.id}`}>
									<button className="px-4 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors">
										View Details
									</button>
								</Link>
								<Link href={`/${currentLocale}/dashboard/organizer/event/${event.id}/participants`}>
									<button className="px-4 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors">
										Manage Participants
									</button>
								</Link>
								<Link href={`/${currentLocale}/dashboard/organizer/event/${event.id}/confirm`}>
									<button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors">
										Confirm Attendance
									</button>
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
