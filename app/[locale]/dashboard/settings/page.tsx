"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function SettingsPage() {
	const router = useRouter();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
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

		const { data: profile } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		setProfile(profile);
		setLoading(false);
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

	return (
		<div className="min-h-screen bg-[#0f0f0f] text-white">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-16 bg-[#1a1a1a] flex flex-col items-center py-6 space-y-8 z-50">
				<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
					<span className="text-white text-xl">✦</span>
				</div>
				<div className="flex-1 flex flex-col space-y-6">
					<Link href={`/${currentLocale}/dashboard`}>
						<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
							<span className="text-gray-400">🏠</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/courses`}>
						<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
							<span className="text-gray-400">📚</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/analytics`}>
						<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
							<span className="text-gray-400">📊</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/files`}>
						<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
							<span className="text-gray-400">📁</span>
						</button>
					</Link>
					<Link href={`/${currentLocale}/dashboard/messages`}>
						<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
							<span className="text-gray-400">💬</span>
						</button>
					</Link>
				</div>
				<Link href={`/${currentLocale}/dashboard/settings`}>
					<button className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
						<span className="text-white">⚙️</span>
					</button>
				</Link>
			</div>

			{/* Main Content */}
			<div className="ml-16 p-8">
				<h1 className="text-4xl font-bold mb-8">Settings</h1>
				<div className="bg-[#1a1a1a] rounded-2xl p-8">
					<div className="space-y-6">
						<div>
							<h2 className="text-xl font-semibold mb-4">Profile Information</h2>
							<div className="space-y-2 text-gray-400">
								<p>Name: {profile?.first_name} {profile?.last_name}</p>
								<p>Email: {user?.email}</p>
								<p>Role: {profile?.role}</p>
								<p>City: {profile?.city}</p>
							</div>
						</div>
						<div className="pt-6 border-t border-gray-700">
							<button
								onClick={handleLogout}
								className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
