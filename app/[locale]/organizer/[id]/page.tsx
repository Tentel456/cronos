"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import OrganizerReviews from "@/components/OrganizerReviews";

interface OrganizerProfile {
	id: string;
	name: string;
	avatar: string;
	organization: string;
	position: string;
	experience: string;
	eventTypes: string[];
	eventsOrganized: number;
	city: string;
}

interface Event {
	id: string;
	title: string;
	description: string;
	category: string;
	date: string;
	location: string;
	image_url: string;
	points_reward: number;
	status: string;
	participantsCount: number;
	maxParticipants: number;
}

export default function OrganizerPublicProfile() {
	const params = useParams();
	const router = useRouter();
	const currentLocale = useLocale();
	const organizerId = params.id as string;

	const [loading, setLoading] = useState(true);
	const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
	const [currentUser, setCurrentUser] = useState<any>(null);

	useEffect(() => {
		loadOrganizerProfile();
	}, [organizerId]);

	const loadOrganizerProfile = async () => {
		try {
			// Get current user
			const { data: { user } } = await supabase.auth.getUser();
			setCurrentUser(user);

			// Load organizer profile
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', organizerId)
				.eq('role', 'organizer')
				.single();

			if (profileError) throw profileError;

			if (!profile) {
				router.push(`/${currentLocale}/dashboard`);
				return;
			}

			setOrganizer({
				id: profile.id,
				name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Организатор',
				avatar: profile.avatar_url || '/circle2.svg',
				organization: profile.organization || 'Не указано',
				position: profile.position || 'Не указано',
				experience: profile.experience || 'Не указано',
				eventTypes: profile.event_types || [],
				eventsOrganized: profile.events_organized || 0,
				city: profile.city || 'Не указано'
			});

			// Load organizer's events
			const { data: eventsData, error: eventsError } = await supabase
				.from('events')
				.select('*')
				.eq('organizer_id', organizerId)
				.eq('moderation_status', 'approved')
				.order('date', { ascending: false });

			if (eventsError) throw eventsError;

			if (eventsData) {
				// Get participant counts for each event
				const eventsWithCounts = await Promise.all(
					eventsData.map(async (event) => {
						const { count } = await supabase
							.from('event_participants')
							.select('*', { count: 'exact', head: true })
							.eq('event_id', event.id);

						return {
							id: event.id,
							title: event.title,
							description: event.description,
							category: event.category,
							date: event.date,
							location: event.location,
							image_url: event.image_url,
							points_reward: event.points_reward,
							status: event.status,
							participantsCount: count || 0,
							maxParticipants: event.max_participants
						};
					})
				);

				setEvents(eventsWithCounts);
			}

			setLoading(false);
		} catch (error) {
			console.error('Error loading organizer profile:', error);
			setLoading(false);
		}
	};

	const filteredEvents = events.filter(event => {
		if (filter === 'all') return true;
		if (filter === 'upcoming') return event.status === 'upcoming' || event.status === 'ongoing';
		if (filter === 'completed') return event.status === 'completed';
		return true;
	});

	const upcomingCount = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
	const completedCount = events.filter(e => e.status === 'completed').length;
	const totalParticipants = events.reduce((sum, e) => sum + e.participantsCount, 0);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Загрузка...</div>
			</div>
		);
	}

	if (!organizer) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Организатор не найден</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0f0f0f] text-white">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-24 bg-[#1a1a1a] flex flex-col items-center py-6 z-50">
				<div className="w-16 h-16 flex items-center justify-center">
					<Image src="/logo.svg" alt="Logo" width={64} height={64} />
				</div>
				<div className="flex-1 flex flex-col space-y-6 mt-8">
					<Link href={`/${currentLocale}/dashboard`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-2xl text-gray-400">🏠</span>
						</button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="ml-24 p-8">
				{/* Back Button */}
				<Link href={`/${currentLocale}/dashboard`}>
					<button className="mb-6 px-4 py-2 border border-gray-600 hover:bg-[#1a1a1a] transition-colors">
						← Назад
					</button>
				</Link>

				{/* Profile Header */}
				<div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 mb-6">
					<div className="flex items-center gap-6">
						<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-3xl flex-shrink-0">
							{organizer.avatar && organizer.avatar !== '/circle2.svg' ? (
								<Image
									src={organizer.avatar}
									alt={organizer.name}
									width={96}
									height={96}
									className="rounded-full"
								/>
							) : (
								<span>{organizer.name.charAt(0)}</span>
							)}
						</div>
						<div className="flex-1">
							<h1 className="text-4xl font-bold mb-2">{organizer.name}</h1>
							<p className="text-xl mb-2">{organizer.position} в {organizer.organization}</p>
							<p className="text-gray-200">{organizer.city}</p>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-4 gap-6 mb-6">
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 mb-2">Всего событий</div>
						<div className="text-3xl font-bold text-purple-400">{organizer.eventsOrganized}</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 mb-2">Предстоящие</div>
						<div className="text-3xl font-bold text-blue-400">{upcomingCount}</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 mb-2">Завершенные</div>
						<div className="text-3xl font-bold text-green-400">{completedCount}</div>
					</div>
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<div className="text-gray-400 mb-2">Всего участников</div>
						<div className="text-3xl font-bold text-orange-400">{totalParticipants}</div>
					</div>
				</div>

				{/* About Section */}
				<div className="grid grid-cols-2 gap-6 mb-6">
					{/* Experience */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<h2 className="text-xl font-bold mb-4">Опыт</h2>
						<p className="text-gray-300">{organizer.experience}</p>
					</div>

					{/* Event Types */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<h2 className="text-xl font-bold mb-4">Типы мероприятий</h2>
						{organizer.eventTypes.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{organizer.eventTypes.map((type, index) => (
									<span key={index} className="px-3 py-1 bg-[#2a2a2a] text-sm">
										{type}
									</span>
								))}
							</div>
						) : (
							<p className="text-gray-400">Не указано</p>
						)}
					</div>
				</div>

				{/* Events Section */}
				<div className="bg-[#1a1a1a] border border-gray-600 p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold">Мероприятия</h2>
						
						{/* Filter Buttons */}
						<div className="flex gap-3">
							<button
								onClick={() => setFilter('all')}
								className={`px-4 py-2 border transition-colors ${
									filter === 'all'
										? 'border-purple-500 bg-purple-500/20 text-white'
										: 'border-gray-600 text-gray-400 hover:bg-[#2a2a2a]'
								}`}
							>
								Все ({events.length})
							</button>
							<button
								onClick={() => setFilter('upcoming')}
								className={`px-4 py-2 border transition-colors ${
									filter === 'upcoming'
										? 'border-purple-500 bg-purple-500/20 text-white'
										: 'border-gray-600 text-gray-400 hover:bg-[#2a2a2a]'
								}`}
							>
								Предстоящие ({upcomingCount})
							</button>
							<button
								onClick={() => setFilter('completed')}
								className={`px-4 py-2 border transition-colors ${
									filter === 'completed'
										? 'border-purple-500 bg-purple-500/20 text-white'
										: 'border-gray-600 text-gray-400 hover:bg-[#2a2a2a]'
								}`}
							>
								Завершенные ({completedCount})
							</button>
						</div>
					</div>

					{/* Events Grid */}
					{filteredEvents.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							Мероприятия не найдены
						</div>
					) : (
						<div className="grid grid-cols-2 gap-6">
							{filteredEvents.map((event) => (
								<div key={event.id} className="bg-[#0f0f0f] border border-gray-600 overflow-hidden hover:border-purple-500 transition-colors">
									{/* Event Image */}
									{event.image_url && (
										<div className="h-48 bg-[#2a2a2a] flex items-center justify-center">
											<Image
												src={event.image_url}
												alt={event.title}
												width={400}
												height={192}
												className="w-full h-full object-cover"
											/>
										</div>
									)}

									<div className="p-6">
										{/* Category & Status */}
										<div className="flex gap-2 mb-3">
											<span className="px-3 py-1 bg-purple-600 text-xs">
												{event.category}
											</span>
											<span className={`px-3 py-1 text-xs ${
												event.status === 'upcoming' ? 'bg-blue-600' :
												event.status === 'ongoing' ? 'bg-green-600' :
												event.status === 'completed' ? 'bg-gray-600' :
												'bg-red-600'
											}`}>
												{event.status === 'upcoming' ? 'Предстоящее' :
												 event.status === 'ongoing' ? 'Идет' :
												 event.status === 'completed' ? 'Завершено' :
												 'Отменено'}
											</span>
										</div>

										{/* Title */}
										<h3 className="text-xl font-bold mb-2">{event.title}</h3>

										{/* Description */}
										<p className="text-gray-400 text-sm mb-4 line-clamp-2">
											{event.description}
										</p>

										{/* Info */}
										<div className="space-y-2 text-sm mb-4">
											<div className="flex items-center gap-2 text-gray-300">
												<span>📅</span>
												<span>{new Date(event.date).toLocaleDateString('ru-RU')}</span>
											</div>
											<div className="flex items-center gap-2 text-gray-300">
												<span>📍</span>
												<span>{event.location}</span>
											</div>
											<div className="flex items-center gap-2 text-gray-300">
												<span>👥</span>
												<span>{event.participantsCount} / {event.maxParticipants} участников</span>
											</div>
											<div className="flex items-center gap-2 text-purple-400 font-bold">
												<span>⭐</span>
												<span>{event.points_reward} баллов</span>
											</div>
										</div>

										{/* View Button */}
										<Link href={`/${currentLocale}/dashboard/category/${event.category.toLowerCase()}`}>
											<button className="w-full px-4 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors">
												Подробнее
											</button>
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
