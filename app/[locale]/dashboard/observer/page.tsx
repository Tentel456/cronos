"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { exportCandidateToPDF } from "@/lib/pdfExport";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";

interface Candidate {
	id: string;
	name: string;
	avatar: string;
	city: string;
	age: number;
	rating: number;
	eventsAttended: number;
	mainCategory: string;
	interests: string[];
	motivation: string;
}

export default function ObserverDashboard() {
	const router = useRouter();
	const currentLocale = useLocale();
	const [loading, setLoading] = useState(true);
	const [candidates, setCandidates] = useState<Candidate[]>([]);
	const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

	// Filters
	const [cityFilter, setCityFilter] = useState<string>('all');
	const [ageFilter, setAgeFilter] = useState<string>('all');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [minRating, setMinRating] = useState<number>(0);

	// Available filter options
	const [cities, setCities] = useState<string[]>([]);
	const [categories, setCategories] = useState<string[]>([]);

	useEffect(() => {
		checkUser();
	}, []);

	useEffect(() => {
		if (!loading) {
			loadCandidates();
		}
	}, [loading]);

	useEffect(() => {
		applyFilters();
	}, [candidates, cityFilter, ageFilter, categoryFilter, minRating]);

	const checkUser = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			router.push(`/${currentLocale}/login`);
			return;
		}

		// Check if user is observer
		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (profile?.role !== 'observer') {
			router.push(`/${currentLocale}/dashboard`);
			return;
		}

		setLoading(false);
	};

	const loadCandidates = async () => {
		try {
			// Get all participants
			const { data: profiles, error } = await supabase
				.from('profiles')
				.select('id, first_name, last_name, avatar_url, city, birth_date, interests, motivation, events_attended')
				.eq('role', 'participant');

			if (error) throw error;

			if (!profiles) {
				setCandidates([]);
				return;
			}

			// Calculate age, rating, and main category for each candidate
			const candidatesData = await Promise.all(
				profiles.map(async (profile) => {
					// Calculate age
					const age = profile.birth_date 
						? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
						: 0;

					// Get rating
					const { data: ratingData } = await supabase
						.rpc('calculate_participant_rating', {
							participant_id: profile.id
						});

					const rating = ratingData || 0;

					// Get most participated category
					const { data: categoryData } = await supabase
						.from('event_participants')
						.select('events(category)')
						.eq('participant_id', profile.id)
						.eq('status', 'confirmed');

					const categoryCounts: Record<string, number> = {};
					if (categoryData) {
						categoryData.forEach((item: any) => {
							const category = item.events?.category;
							if (category) {
								categoryCounts[category] = (categoryCounts[category] || 0) + 1;
							}
						});
					}

					let mainCategory = 'General';
					let maxCount = 0;
					Object.entries(categoryCounts).forEach(([category, count]) => {
						if (count > maxCount) {
							maxCount = count;
							mainCategory = category;
						}
					});

					return {
						id: profile.id,
						name: `${profile.first_name} ${profile.last_name}`,
						avatar: profile.avatar_url || '/circle2.svg',
						city: profile.city || 'Unknown',
						age,
						rating,
						eventsAttended: profile.events_attended || 0,
						mainCategory,
						interests: profile.interests || [],
						motivation: profile.motivation || ''
					};
				})
			);

			// Sort by rating
			candidatesData.sort((a, b) => b.rating - a.rating);

			setCandidates(candidatesData);

			// Extract unique cities and categories for filters
			const uniqueCities = Array.from(new Set(candidatesData.map(c => c.city).filter(c => c !== 'Unknown')));
			const uniqueCategories = Array.from(new Set(candidatesData.map(c => c.mainCategory).filter(c => c !== 'General')));

			setCities(uniqueCities);
			setCategories(uniqueCategories);
		} catch (error) {
			console.error('Error loading candidates:', error);
			setCandidates([]);
		}
	};

	const applyFilters = () => {
		let filtered = [...candidates];

		// City filter
		if (cityFilter !== 'all') {
			filtered = filtered.filter(c => c.city === cityFilter);
		}

		// Age filter
		if (ageFilter !== 'all') {
			if (ageFilter === '18-25') {
				filtered = filtered.filter(c => c.age >= 18 && c.age <= 25);
			} else if (ageFilter === '26-35') {
				filtered = filtered.filter(c => c.age >= 26 && c.age <= 35);
			} else if (ageFilter === '36+') {
				filtered = filtered.filter(c => c.age >= 36);
			}
		}

		// Category filter
		if (categoryFilter !== 'all') {
			filtered = filtered.filter(c => c.mainCategory === categoryFilter);
		}

		// Rating filter
		if (minRating > 0) {
			filtered = filtered.filter(c => c.rating >= minRating);
		}

		setFilteredCandidates(filtered);
	};

	const exportToPDF = (candidate: Candidate) => {
		exportCandidateToPDF({
			name: candidate.name,
			city: candidate.city,
			age: candidate.age,
			rating: candidate.rating,
			eventsAttended: candidate.eventsAttended,
			mainCategory: candidate.mainCategory,
			interests: candidate.interests,
			motivation: candidate.motivation
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Загрузка...</div>
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
				<Link href={`/${currentLocale}/dashboard/settings`}>
					<button className="w-12 h-12 flex items-center justify-center">
						<span className="text-2xl text-gray-400">⚙️</span>
					</button>
				</Link>
			</div>

			{/* Main Content */}
			<div className="ml-24 p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">Кадровый резерв</h1>
					<p className="text-gray-400">Просмотр и анализ кандидатов</p>
				</div>

				{/* Filters */}
				<div className="bg-[#1a1a1a] border border-gray-600 p-6 mb-6">
					<h2 className="text-xl font-bold mb-4">Фильтры</h2>
					<div className="grid grid-cols-4 gap-4">
						{/* City Filter */}
						<div>
							<label className="block text-sm text-gray-400 mb-2">Город</label>
							<select
								value={cityFilter}
								onChange={(e) => setCityFilter(e.target.value)}
								className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
							>
								<option value="all">Все города</option>
								{cities.map(city => (
									<option key={city} value={city}>{city}</option>
								))}
							</select>
						</div>

						{/* Age Filter */}
						<div>
							<label className="block text-sm text-gray-400 mb-2">Возраст</label>
							<select
								value={ageFilter}
								onChange={(e) => setAgeFilter(e.target.value)}
								className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
							>
								<option value="all">Все возрасты</option>
								<option value="18-25">18-25 лет</option>
								<option value="26-35">26-35 лет</option>
								<option value="36+">36+ лет</option>
							</select>
						</div>

						{/* Category Filter */}
						<div>
							<label className="block text-sm text-gray-400 mb-2">Направление</label>
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
							>
								<option value="all">Все направления</option>
								{categories.map(category => (
									<option key={category} value={category}>{category}</option>
								))}
							</select>
						</div>

						{/* Rating Filter */}
						<div>
							<label className="block text-sm text-gray-400 mb-2">Минимальный рейтинг</label>
							<input
								type="number"
								value={minRating}
								onChange={(e) => setMinRating(Number(e.target.value))}
								min="0"
								className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
								placeholder="0"
							/>
						</div>
					</div>

					{/* Stats */}
					<div className="mt-4 flex gap-6 text-sm">
						<div>
							<span className="text-gray-400">Всего кандидатов: </span>
							<span className="text-white font-bold">{candidates.length}</span>
						</div>
						<div>
							<span className="text-gray-400">После фильтрации: </span>
							<span className="text-purple-400 font-bold">{filteredCandidates.length}</span>
						</div>
					</div>
				</div>

				{/* Candidates Grid */}
				<div className="grid grid-cols-2 gap-6">
					{/* Candidates List */}
					<div className="bg-[#1a1a1a] border border-gray-600">
						<div className="p-4 border-b border-gray-600">
							<h2 className="text-xl font-bold">Список кандидатов</h2>
						</div>
						<div className="divide-y divide-gray-600 max-h-[600px] overflow-y-auto">
							{filteredCandidates.length === 0 ? (
								<div className="p-8 text-center text-gray-400">
									Кандидаты не найдены
								</div>
							) : (
								filteredCandidates.map((candidate) => (
									<div
										key={candidate.id}
										onClick={() => setSelectedCandidate(candidate)}
										className={`p-4 cursor-pointer hover:bg-[#222] transition-colors ${
											selectedCandidate?.id === candidate.id ? 'bg-[#2a2a2a]' : ''
										}`}
									>
										<div className="flex items-center gap-3 mb-2">
											<div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
												{candidate.avatar && candidate.avatar !== '/circle2.svg' ? (
													<Image
														src={candidate.avatar}
														alt={candidate.name}
														width={48}
														height={48}
														className="rounded-full"
													/>
												) : (
													<span>{candidate.name.charAt(0)}</span>
												)}
											</div>
											<div className="flex-1">
												<div className="font-semibold">{candidate.name}</div>
												<div className="text-sm text-gray-400">{candidate.city}</div>
											</div>
										</div>
										<div className="flex gap-4 text-sm">
											<div>
												<span className="text-gray-400">Рейтинг: </span>
												<span className="text-purple-400 font-bold">{candidate.rating}</span>
											</div>
											<div>
												<span className="text-gray-400">События: </span>
												<span className="text-white">{candidate.eventsAttended}</span>
											</div>
											<div>
												<span className="text-gray-400">Возраст: </span>
												<span className="text-white">{candidate.age}</span>
											</div>
										</div>
										<div className="mt-2">
											<span className="px-2 py-1 bg-[#2a2a2a] text-xs">
												{candidate.mainCategory}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Candidate Details */}
					<div className="bg-[#1a1a1a] border border-gray-600">
						<div className="p-4 border-b border-gray-600">
							<h2 className="text-xl font-bold">Детальная информация</h2>
						</div>
						{selectedCandidate ? (
							<div className="p-6">
								{/* Profile Header */}
								<div className="flex items-center gap-4 mb-6">
									<div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
										{selectedCandidate.avatar && selectedCandidate.avatar !== '/circle2.svg' ? (
											<Image
												src={selectedCandidate.avatar}
												alt={selectedCandidate.name}
												width={80}
												height={80}
												className="rounded-full"
											/>
										) : (
											<span>{selectedCandidate.name.charAt(0)}</span>
										)}
									</div>
									<div>
										<h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
										<p className="text-gray-400">{selectedCandidate.city}, {selectedCandidate.age} лет</p>
									</div>
								</div>

								{/* Stats Cards */}
								<div className="grid grid-cols-3 gap-4 mb-6">
									<div className="bg-[#0f0f0f] p-4 border border-gray-600">
										<div className="text-gray-400 text-sm mb-1">Рейтинг</div>
										<div className="text-2xl font-bold text-purple-400">{selectedCandidate.rating}</div>
									</div>
									<div className="bg-[#0f0f0f] p-4 border border-gray-600">
										<div className="text-gray-400 text-sm mb-1">События</div>
										<div className="text-2xl font-bold">{selectedCandidate.eventsAttended}</div>
									</div>
									<div className="bg-[#0f0f0f] p-4 border border-gray-600">
										<div className="text-gray-400 text-sm mb-1">Направление</div>
										<div className="text-lg font-bold">{selectedCandidate.mainCategory}</div>
									</div>
								</div>

								{/* Interests */}
								{selectedCandidate.interests.length > 0 && (
									<div className="mb-6">
										<h4 className="text-lg font-bold mb-3">Интересы</h4>
										<div className="flex flex-wrap gap-2">
											{selectedCandidate.interests.map((interest, index) => (
												<span key={index} className="px-3 py-1 bg-[#2a2a2a] text-sm">
													{interest}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Motivation */}
								{selectedCandidate.motivation && (
									<div className="mb-6">
										<h4 className="text-lg font-bold mb-3">Мотивация</h4>
										<p className="text-gray-300">{selectedCandidate.motivation}</p>
									</div>
								)}

								{/* Actions */}
								<div className="flex gap-3">
									<button
										onClick={() => exportToPDF(selectedCandidate)}
										className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors"
									>
										Экспорт в PDF
									</button>
									<Link href={`/${currentLocale}/dashboard/profile?id=${selectedCandidate.id}`}>
										<button className="px-6 py-3 border border-gray-600 hover:bg-[#2a2a2a] transition-colors">
											Полный профиль
										</button>
									</Link>
								</div>
							</div>
						) : (
							<div className="p-8 text-center text-gray-400">
								Выберите кандидата для просмотра деталей
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
