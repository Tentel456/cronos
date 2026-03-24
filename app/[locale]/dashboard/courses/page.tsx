"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";

export default function CoursesPage() {
	const router = useRouter();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);

	// Popular event categories
	const popularTags = [
		{ name: 'Technology', count: 45, image: '/circle2.svg' },
		{ name: 'Design', count: 32, image: '/Design.svg' },
		{ name: 'Business', count: 28, image: '/circle2.svg' },
		{ name: 'Science', count: 25, image: '/circle2.svg' },
		{ name: 'Art', count: 20, image: '/circle2.svg' },
		{ name: 'Sports', count: 18, image: '/circle2.svg' },
		{ name: 'Education', count: 35, image: '/circle2.svg' },
		{ name: 'Ecology', count: 15, image: '/circle2.svg' },
	];

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
		setLoading(false);
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
							<span className="text-gray-400 text-2xl">🏠</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/courses`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-white text-2xl">📚</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/analytics`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">📊</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/files`}>
						<button className="w-12 h-12 flex items-center justify-center">
							<span className="text-gray-400 text-2xl">📁</span>
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
				<h1 className="text-4xl font-bold mb-8">Popular Event Categories</h1>
				<div className="grid grid-cols-3 gap-4">
					{popularTags.map((tag, idx) => (
						<Link 
							key={idx}
							href={`/${currentLocale}/dashboard/category/${tag.name.toLowerCase()}`}
						>
							<div className="relative h-48 rounded-3xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group">
								<Image 
									src={tag.image} 
									alt={tag.name} 
									fill
									className="object-cover"
								/>
								<div className="absolute inset-0 bg-black/50 flex items-center justify-start pl-8">
									<span className="text-white font-bold text-2xl">
										{tag.name}
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
