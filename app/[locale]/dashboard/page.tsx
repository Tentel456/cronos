"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import OnboardingModal from "@/components/onboarding/onboarding-modal";
import Image from "next/image";
import Link from "next/link";
import { Line } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
} from 'chart.js';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

export default function DashboardPage() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [profile, setProfile] = useState<any>(null);

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

		// Check if user has completed onboarding
		const { data: profile } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		setProfile(profile);

		// Show onboarding if not completed
		if (!profile?.onboarding_completed) {
			setShowOnboarding(true);
		}

		// Redirect organizers to their dashboard
		if (profile?.role === 'organizer' && profile?.onboarding_completed) {
			router.push(`/${currentLocale}/dashboard/organizer`);
			return;
		}

		// Redirect observers to their dashboard
		if (profile?.role === 'observer' && profile?.onboarding_completed) {
			router.push(`/${currentLocale}/dashboard/observer`);
			return;
		}

		setLoading(false);
	};

	const handleOnboardingComplete = async (onboardingData: any) => {
		try {
			console.log('Dashboard onboarding data:', onboardingData);
			
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				throw new Error('User not authenticated');
			}
			
			// Determine verification status based on role
			let verificationStatus = 'approved'; // Default for participants
			if (onboardingData.role === 'organizer' || onboardingData.role === 'observer') {
				verificationStatus = 'pending'; // Always set to pending for organizers and observers
			}

			console.log('Updating profile with verification status:', verificationStatus);
			console.log('Role:', onboardingData.role);

			// Prepare update data - only include fields that have values
			const updateData: any = {
				role: onboardingData.role,
				onboarding_completed: true,
				verification_status: verificationStatus,
			};

			// Add fields based on role
			if (onboardingData.firstName) updateData.first_name = onboardingData.firstName;
			if (onboardingData.lastName) updateData.last_name = onboardingData.lastName;
			if (onboardingData.birthDate) updateData.birth_date = onboardingData.birthDate;
			if (onboardingData.city) updateData.city = onboardingData.city;
			if (onboardingData.interests) updateData.interests = onboardingData.interests;
			if (onboardingData.motivation) updateData.motivation = onboardingData.motivation;
			if (onboardingData.organization) updateData.organization = onboardingData.organization;
			if (onboardingData.position) updateData.position = onboardingData.position;
			if (onboardingData.experience) updateData.experience = onboardingData.experience;
			if (onboardingData.eventTypes) updateData.event_types = onboardingData.eventTypes;
			if (onboardingData.role === 'observer') updateData.observer_role = onboardingData.role;

			console.log('Update data:', updateData);

			// Save to profiles table
			const { data: updatedProfileData, error: profileError } = await supabase
				.from('profiles')
				.update(updateData)
				.eq('id', user.id)
				.select();

			if (profileError) {
				console.error('Profile update error:', profileError);
				throw profileError;
			}

			console.log('Profile updated successfully:', updatedProfileData);

			// Refresh profile
			const { data: updatedProfile } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();

			setProfile(updatedProfile);
			setShowOnboarding(false);
			
			// Show success message for organizers/observers
			if (onboardingData.role === 'organizer' || onboardingData.role === 'observer') {
				alert(currentLocale === 'ru' 
					? 'Заявка отправлена! Ожидайте подтверждения администратора.' 
					: 'Application submitted! Awaiting admin approval.');
			}
		} catch (error: any) {
			console.error("Failed to save onboarding data:", error);
			alert(currentLocale === 'ru' 
				? `Ошибка: ${error.message || "Не удалось сохранить данные"}` 
				: `Error: ${error.message || "Failed to save onboarding data"}`);
		}
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push(`/${currentLocale}/login`);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
				<div className="text-2xl text-gray-400">Loading...</div>
			</div>
		);
	}

	const isActive = (path: string) => pathname === `/${currentLocale}${path}`;

	// Mock data for recent events
	const recentEvents = [
		{ 
			name: 'AI Hackathon', 
			date: 'March 15, 2026',
			status: 'Participating',
			category: 'Technology',
			icon: '🤖'
		},
		{ 
			name: 'Design Workshop', 
			date: 'March 20, 2026',
			status: 'Registered',
			category: 'Design',
			icon: '🎨'
		},
		{ 
			name: 'Startup Conference', 
			date: 'March 25, 2026',
			status: 'Completed',
			category: 'Business',
			icon: '💼'
		},
		{ 
			name: 'Developer Meetup', 
			date: 'April 1, 2026',
			status: 'Interested',
			category: 'Technology',
			icon: '💻'
		},
	];

	// Mock data for rating growth chart
	const ratingData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
		datasets: [
			{
				label: 'Rating',
				data: [120, 150, 180, 220, 280, 350, 420, 500],
				borderColor: 'rgb(168, 85, 247)',
				backgroundColor: (context: any) => {
					const ctx = context.chart.ctx;
					const gradient = ctx.createLinearGradient(0, 0, 0, 200);
					gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
					gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
					return gradient;
				},
				fill: true,
				tension: 0.5,
				pointRadius: 0,
				pointHoverRadius: 6,
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: 'rgb(168, 85, 247)',
				pointHoverBorderWidth: 3,
				borderWidth: 2.5,
			}
		]
	};

	const chartOptions: any = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			mode: 'nearest',
			axis: 'x',
			intersect: false,
		},
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				enabled: true,
				backgroundColor: 'rgba(15, 15, 15, 0.9)',
				padding: 12,
				titleColor: '#9ca3af',
				titleFont: {
					size: 11,
					weight: 'normal'
				},
				bodyColor: '#fff',
				bodyFont: {
					size: 18,
					weight: 'bold'
				},
				borderColor: 'rgba(168, 85, 247, 0.3)',
				borderWidth: 1,
				cornerRadius: 8,
				displayColors: false,
				caretSize: 6,
				callbacks: {
					title: function(context: any) {
						return context[0].label;
					},
					label: function(context: any) {
						return context.parsed.y + ' points';
					}
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				grid: {
					color: 'rgba(255, 255, 255, 0.03)',
					drawBorder: false,
				},
				border: {
					display: false,
					dash: [5, 5]
				},
				ticks: {
					color: '#4b5563',
					font: {
						size: 11,
						weight: 500
					},
					padding: 10,
					stepSize: 100
				}
			},
			x: {
				grid: {
					display: false
				},
				border: {
					display: false
				},
				ticks: {
					color: '#6b7280',
					font: {
						size: 11,
						weight: 600
					},
					padding: 10
				}
			}
		}
	};

	// Popular event categories (tag cloud)
	const popularTags = [
		{ name: 'Technology', count: 45, image: '/circle2.svg' },
		{ name: 'Design', count: 32, image: '/circle2.svg' },
		{ name: 'Business', count: 28, image: '/circle2.svg' },
		{ name: 'Science', count: 25, image: '/circle2.svg' },
		{ name: 'Art', count: 20, image: '/circle2.svg' },
		{ name: 'Sports', count: 18, image: '/circle2.svg' },
		{ name: 'Education', count: 35, image: '/circle2.svg' },
		{ name: 'Ecology', count: 15, image: '/circle2.svg' },
	];

	return (
		<>
			<OnboardingModal 
				isOpen={showOnboarding} 
				onComplete={handleOnboardingComplete}
			/>

			<div className="min-h-screen bg-[#0f0f0f] text-white">
				{/* Sidebar */}
				<div className="fixed left-0 top-0 h-full w-24 bg-[#1a1a1a] flex flex-col items-center py-6 space-y-12 z-50">
					<Link href={`/${currentLocale}/dashboard`}>
					<div className="w-16 h-16 flex items-center justify-center">
						<Image src="/logo.svg" alt="Logo" width={64} height={64} />
					</div>
					</Link>
					<div className="flex-1 flex flex-col space-y-6 mt-8">
						<Link href={`/${currentLocale}/dashboard/courses`}>
							<button className={`w-10 h-10 rounded-lg flex items-center justify-center ${
								isActive('/dashboard/courses') ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'
							}`}>
								<span className={isActive('/dashboard/courses') ? 'text-white' : 'text-gray-400'}><Image src="/events.svg" alt="Logo" width={50} height={50} /></span>
							</button>
						</Link>
						<Link href={`/${currentLocale}/dashboard/analytics`}>
							<button className="w-12 h-12 flex items-center justify-center">
								<span className={`text-2xl ${isActive('/dashboard/analytics') ? 'text-white' : 'text-gray-400'}`}><Image src="/leaderboard.svg" alt="Logo" width={35} height={35} /></span>
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
					<div className="flex justify-between items-center mb-8">
						<h1 className="text-3xl font-bold">
							Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}
						</h1>
						<div className="flex items-center gap-4">
							<input
								type="text"
								placeholder="Search..."
								className="bg-[#1a1a1a] text-gray-400 px-4 py-2 border border-gray-600 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
							<button className="w-10 h-10 bg-[#1a1a1a] border border-gray-600 flex items-center justify-center">
								<Image src="/notifications.svg" alt="Search" width={20} height={20} />
							</button>
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

					{/* Hero Card */}
					<div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-3xl p-8 mb-8 relative overflow-hidden">
						<div className="absolute inset-0">
							<Image src="/banner.svg" alt="Hero" fill className="object-cover" />
						</div>
						<div className="relative z-10">
							<span className="text-purple-400 text-sm font-semibold">Physics</span>
							<h2 className="text-4xl font-bold mt-2 mb-6">
								The study of the<br />structure of matter.
							</h2>
							<button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full transition-colors">
								<span>▶</span>
								<span>CONTINUE COURSE</span>
							</button>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-8">
						{/* Recent Events Feed */}
						<div>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-semibold">Recent Events Feed</h3>
								<button className="text-gray-400 text-sm">Filter ▼</button>
							</div>
							<div className="space-y-3">
								{recentEvents.map((event, idx) => (
									<div key={idx} className="bg-[#1a1a1a] border border-gray-600 p-6 flex items-center gap-4 hover:bg-[#222] transition-colors cursor-pointer">
										<div className="w-16 h-16 flex items-center justify-center">
											<Image src="/circle2.svg" alt="Event" width={64} height={64} />
										</div>
										<div className="flex-1">
											<h4 className="font-semibold text-lg mb-1">{event.name}</h4>
											<p className="text-gray-400 text-sm">{event.date}</p>
										</div>
										<div className="flex flex-col gap-3">
											<span className={`text-xs px-3 py-1.5 border text-center ${
												event.status === 'Completed' 
													? 'border-green-400 text-green-400' 
													: event.status === 'Participating'
													? 'border-purple-400 text-purple-400'
													: 'border-gray-400 text-gray-400'
											}`}>
												{event.status}
											</span>
											<span className="text-xs px-2 py-1.5 bg-[#2a2a2a] text-gray-300 text-center">
												{event.category}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Rating Growth Chart */}
						<div>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-semibold">Activity Chart</h3>
								<button className="text-gray-400 text-sm">Last month ▼</button>
							</div>
							<div className="bg-[#1a1a1a] border border-gray-600 p-6">
								<h4 className="font-semibold mb-4">Participant Rating Growth</h4>
								<div className="h-48 mb-4">
									<Line data={ratingData} options={chartOptions} />
								</div>
								<div className="text-center">
									<div className="text-4xl font-bold text-purple-400">500</div>
									<div className="text-gray-400 text-sm">Current Rating</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
