"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface Reward {
	type: string;
	name: string;
	description: string;
	quantity: number;
}

export default function CreateEventPage() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [saving, setSaving] = useState(false);

	// Form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('Technology');
	const [date, setDate] = useState('');
	const [location, setLocation] = useState('');
	const [pointsReward, setPointsReward] = useState(100);
	const [maxParticipants, setMaxParticipants] = useState(50);
	const [rewards, setRewards] = useState<Reward[]>([]);

	// Reward form
	const [showRewardForm, setShowRewardForm] = useState(false);
	const [rewardType, setRewardType] = useState('merch');
	const [rewardName, setRewardName] = useState('');
	const [rewardDescription, setRewardDescription] = useState('');
	const [rewardQuantity, setRewardQuantity] = useState(1);

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

		setLoading(false);
	};

	const isActive = (path: string) => pathname === `/${currentLocale}${path}`;

	const addReward = () => {
		if (!rewardName) return;

		setRewards([...rewards, {
			type: rewardType,
			name: rewardName,
			description: rewardDescription,
			quantity: rewardQuantity
		}]);

		// Reset form
		setRewardName('');
		setRewardDescription('');
		setRewardQuantity(1);
		setShowRewardForm(false);
	};

	const removeReward = (index: number) => {
		setRewards(rewards.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);

		try {
			if (!user) return;

			// Create event in Supabase
			const { data: eventData, error: eventError } = await supabase
				.from('events')
				.insert({
					organizer_id: user.id,
					title,
					description,
					category,
					date,
					location,
					points_reward: pointsReward,
					max_participants: maxParticipants,
					status: 'upcoming'
				})
				.select()
				.single();

			if (eventError) throw eventError;

			// Create rewards if any
			if (rewards.length > 0 && eventData) {
				const rewardsToInsert = rewards.map(reward => ({
					event_id: eventData.id,
					reward_type: reward.type,
					reward_name: reward.name,
					reward_description: reward.description,
					quantity: reward.quantity
				}));

				const { error: rewardsError } = await supabase
					.from('event_rewards')
					.insert(rewardsToInsert);

				if (rewardsError) throw rewardsError;
			}

			// Update organizer's events_organized counter
			const { error: updateError } = await supabase.rpc('increment_events_organized', {
				organizer_id: user.id
			});

			if (updateError) console.error('Error updating counter:', updateError);

			// Redirect to organizer dashboard
			router.push(`/${currentLocale}/dashboard/organizer`);
		} catch (error: any) {
			console.error('Error creating event:', error);
			alert('Failed to create event. Please try again.');
		} finally {
			setSaving(false);
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
					<Link href={`/${currentLocale}/dashboard/organizer`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">🏠</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/courses`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">📚</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/analytics`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">📊</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/messages`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">💬</span>
						</button>
					</Link>
				</div>
				<Link href={`/${currentLocale}/dashboard/settings`}>
					<button className="w-12 h-12 flex items-center justify-center">
						<span className="text-gray-400 text-2xl">⚙️</span>
					</button>
				</Link>
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
					<h1 className="text-3xl font-bold">Create New Event</h1>
				</div>

				<form onSubmit={handleSubmit} className="max-w-4xl">
					{/* Basic Information */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6 mb-6">
						<h2 className="text-xl font-semibold mb-4">Basic Information</h2>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-2">Event Title *</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Description *</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
									className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-2">Category *</label>
									<select
										value={category}
										onChange={(e) => setCategory(e.target.value)}
										className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
									>
										<option value="Technology">Technology</option>
										<option value="Design">Design</option>
										<option value="Business">Business</option>
										<option value="Science">Science</option>
										<option value="Art">Art</option>
										<option value="Sports">Sports</option>
										<option value="Education">Education</option>
										<option value="Ecology">Ecology</option>
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-2">Date *</label>
									<input
										type="datetime-local"
										value={date}
										onChange={(e) => setDate(e.target.value)}
										className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Location *</label>
								<input
									type="text"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
									className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="City, Country"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-2">Points Reward *</label>
									<input
										type="number"
										value={pointsReward}
										onChange={(e) => setPointsReward(parseInt(e.target.value))}
										className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
										min="0"
										required
									/>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-2">Max Participants *</label>
									<input
										type="number"
										value={maxParticipants}
										onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
										className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
										min="1"
										required
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Rewards Section */}
					<div className="bg-[#1a1a1a] border border-gray-600 p-6 mb-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">Rewards & Bonuses</h2>
							<button
								type="button"
								onClick={() => setShowRewardForm(!showRewardForm)}
								className="px-4 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors"
							>
								+ Add Reward
							</button>
						</div>

						{showRewardForm && (
							<div className="bg-[#0f0f0f] border border-gray-600 p-4 mb-4">
								<div className="grid grid-cols-2 gap-4 mb-4">
									<div>
										<label className="block text-sm text-gray-400 mb-2">Reward Type</label>
										<select
											value={rewardType}
											onChange={(e) => setRewardType(e.target.value)}
											className="w-full bg-[#1a1a1a] border border-gray-600 px-4 py-2"
										>
											<option value="merch">Merch</option>
											<option value="tickets">Tickets</option>
											<option value="meeting">Meeting</option>
											<option value="other">Other</option>
										</select>
									</div>

									<div>
										<label className="block text-sm text-gray-400 mb-2">Reward Name</label>
										<input
											type="text"
											value={rewardName}
											onChange={(e) => setRewardName(e.target.value)}
											className="w-full bg-[#1a1a1a] border border-gray-600 px-4 py-2"
											placeholder="e.g., T-Shirt, Conference Pass"
										/>
									</div>
								</div>

								<div className="mb-4">
									<label className="block text-sm text-gray-400 mb-2">Description</label>
									<input
										type="text"
										value={rewardDescription}
										onChange={(e) => setRewardDescription(e.target.value)}
										className="w-full bg-[#1a1a1a] border border-gray-600 px-4 py-2"
									/>
								</div>

								<div className="mb-4">
									<label className="block text-sm text-gray-400 mb-2">Quantity</label>
									<input
										type="number"
										value={rewardQuantity}
										onChange={(e) => setRewardQuantity(parseInt(e.target.value))}
										className="w-full bg-[#1a1a1a] border border-gray-600 px-4 py-2"
										min="1"
									/>
								</div>

								<div className="flex gap-2">
									<button
										type="button"
										onClick={addReward}
										className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors"
									>
										Add
									</button>
									<button
										type="button"
										onClick={() => setShowRewardForm(false)}
										className="px-4 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors"
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						{/* Rewards List */}
						{rewards.length > 0 && (
							<div className="space-y-2">
								{rewards.map((reward, index) => (
									<div key={index} className="flex justify-between items-center bg-[#0f0f0f] border border-gray-600 p-3">
										<div>
											<div className="font-semibold">{reward.name}</div>
											<div className="text-sm text-gray-400">
												{reward.type} • Quantity: {reward.quantity}
												{reward.description && ` • ${reward.description}`}
											</div>
										</div>
										<button
											type="button"
											onClick={() => removeReward(index)}
											className="text-red-400 hover:text-red-300"
										>
											Remove
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Submit Button */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={saving}
							className="px-8 py-3 bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
						>
							{saving ? 'Creating...' : 'Create Event'}
						</button>
						<Link href={`/${currentLocale}/dashboard/organizer`}>
							<button
								type="button"
								className="px-8 py-3 border border-gray-600 hover:bg-[#1a1a1a] transition-colors"
							>
								Cancel
							</button>
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
