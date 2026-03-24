"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";

type FilterCategory = 'all' | 'technology' | 'social' | 'media';

interface LeaderboardEntry {
	id: string;
	rank: number;
	name: string;
	avatar: string;
	rating: number;
	category: string;
	eventsCompleted: number;
	city: string;
}

export default function LeaderboardPage() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [loading, setLoading] = useState(true);
	const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
	const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

	useEffect(() => {
		checkUser();
	}, []);

	useEffect(() => {
		if (!loading) {
			loadLeaderboard();
		}
	}, [loading, activeFilter]);

	const checkUser = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			router.push(`/${currentLocale}/login`);
			return;
		}
		setLoading(false);
	};

	const loadLeaderboard = async () => {
		try {
			// Get all participants with their profile data
			const { data: profiles, error } = await supabase
				.from('profiles')
				.select('id, first_name, last_name, avatar_url, city, events_attended')
				.eq('role', 'participant')
				.order('events_attended', { ascending: false });

			if (error) throw error;

			if (!profiles) {
				setLeaders([]);
				return;
			}

			// Calculate rating for each participant and get their most participated category
			const leadersWithRatings = await Promise.all(
				profiles.map(async (profile) => {
					// Get rating using RPC function
					const { data: ratingData } = await supabase
						.rpc('calculate_participant_rating', {
							participant_id: profile.id
						});

					const rating = ratingData || 0;

					// Get most participated event category
					const { data: categoryData } = await supabase
						.from('event_participants')
						.select('events(category)')
						.eq('participant_id', profile.id)
						.eq('status', 'confirmed');

					// Count categories
					const categoryCounts: Record<string, number> = {};
					if (categoryData) {
						categoryData.forEach((item: any) => {
							const category = item.events?.category;
							if (category) {
								categoryCounts[category] = (categoryCounts[category] || 0) + 1;
							}
						});
					}

					// Find most common category
					let mostCommonCategory = 'General';
					let maxCount = 0;
					Object.entries(categoryCounts).forEach(([category, count]) => {
						if (count > maxCount) {
							maxCount = count;
							mostCommonCategory = category;
						}
					});

					return {
						id: profile.id,
						name: `${profile.first_name} ${profile.last_name}`,
						avatar: profile.avatar_url || '/circle2.svg',
						rating,
						category: mostCommonCategory,
						eventsCompleted: profile.events_attended || 0,
						city: profile.city || 'Unknown'
					};
				})
			);

			// Sort by rating descending
			leadersWithRatings.sort((a, b) => b.rating - a.rating);

			// Filter by category if needed
			let filteredData = leadersWithRatings;
			if (activeFilter !== 'all') {
				filteredData = leadersWithRatings.filter(leader => 
					leader.category.toLowerCase() === activeFilter.toLowerCase()
				);
			}

			// Assign ranks and limit to top 100
			const rankedLeaders = filteredData.slice(0, 100).map((leader, index) => ({
				...leader,
				rank: index + 1
			}));

			setLeaders(rankedLeaders);
		} catch (error) {
			console.error('Error loading leaderboard:', error);
			setLeaders([]);
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

	const getRankColor = (rank: number) => {
		if (rank === 1) return 'text-yellow-400';
		if (rank === 2) return 'text-gray-300';
		if (rank === 3) return 'text-orange-400';
		return 'text-gray-400';
	};

	const getRankBadge = (rank: number) => {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return rank;
	};

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
					<h1 className="text-4xl font-bold mb-2">Global Leaderboard</h1>
					<p className="text-gray-400">Top 100 participants ranked by rating</p>
				</div>

				{/* Filter Buttons */}
				<div className="flex gap-3 mb-6">
					<button
						onClick={() => setActiveFilter('all')}
						className={`px-6 py-2 border transition-colors ${
							activeFilter === 'all'
								? 'border-purple-500 bg-purple-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						All Categories
					</button>
					<button
						onClick={() => setActiveFilter('technology')}
						className={`px-6 py-2 border transition-colors ${
							activeFilter === 'technology'
								? 'border-purple-500 bg-purple-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Technology
					</button>
					<button
						onClick={() => setActiveFilter('social')}
						className={`px-6 py-2 border transition-colors ${
							activeFilter === 'social'
								? 'border-purple-500 bg-purple-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Social Projects
					</button>
					<button
						onClick={() => setActiveFilter('media')}
						className={`px-6 py-2 border transition-colors ${
							activeFilter === 'media'
								? 'border-purple-500 bg-purple-500/20 text-white'
								: 'border-gray-600 text-gray-400 hover:bg-[#1a1a1a]'
						}`}
					>
						Media
					</button>
				</div>

				{/* Leaderboard Table */}
				<div className="bg-[#1a1a1a] border border-gray-600">
					{/* Table Header */}
					<div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-600 text-gray-400 text-sm font-semibold">
						<div className="col-span-1">Rank</div>
						<div className="col-span-3">Participant</div>
						<div className="col-span-2">Category</div>
						<div className="col-span-2">Rating</div>
						<div className="col-span-2">Events</div>
						<div className="col-span-2">City</div>
					</div>

					{/* Table Body */}
					<div className="divide-y divide-gray-600">
						{leaders.length === 0 ? (
							<div className="p-8 text-center text-gray-400">
								No participants found. Start participating in events to appear on the leaderboard!
							</div>
						) : (
							leaders.map((leader) => (
								<div
									key={leader.id}
									className="grid grid-cols-12 gap-4 p-4 hover:bg-[#222] transition-colors cursor-pointer"
								>
									{/* Rank */}
									<div className={`col-span-1 flex items-center text-2xl font-bold ${getRankColor(leader.rank)}`}>
										{getRankBadge(leader.rank)}
									</div>

									{/* Participant */}
									<div className="col-span-3 flex items-center gap-3">
										<div className="w-10 h-10 flex-shrink-0 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
											{leader.avatar && leader.avatar !== '/circle2.svg' ? (
												<Image
													src={leader.avatar}
													alt={leader.name}
													width={40}
													height={40}
													className="rounded-full"
												/>
											) : (
												<span>{leader.name.charAt(0)}</span>
											)}
										</div>
										<span className="font-semibold">{leader.name}</span>
									</div>

									{/* Category */}
									<div className="col-span-2 flex items-center">
										<span className="px-3 py-1 bg-[#2a2a2a] text-sm">
											{leader.category}
										</span>
									</div>

									{/* Rating */}
									<div className="col-span-2 flex items-center">
										<span className="text-purple-400 font-bold text-lg">
											{leader.rating}
										</span>
									</div>

									{/* Events Completed */}
									<div className="col-span-2 flex items-center text-gray-300">
										{leader.eventsCompleted} completed
									</div>

									{/* City */}
									<div className="col-span-2 flex items-center text-gray-400">
										{leader.city}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Info Message */}
				{leaders.length > 0 && (
					<div className="mt-6 text-center text-gray-400 text-sm">
						Showing top {leaders.length} participants
					</div>
				)}
			</div>
		</div>
	);
}
