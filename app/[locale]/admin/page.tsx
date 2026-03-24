"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Image from "next/image";

const ADMIN_EMAIL = "fdu8808@gmail.com";

export default function AdminDashboard() {
	const router = useRouter();
	const currentLocale = useLocale();
	const [loading, setLoading] = useState(true);
	const [profiles, setProfiles] = useState<any[]>([]);
	const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
	const [events, setEvents] = useState<any[]>([]);
	const [eventFilter, setEventFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
	const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'events'>('overview');

	useEffect(() => {
		checkAdmin();
	}, []);

	const checkAdmin = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		
		if (!user) {
			router.push(`/${currentLocale}/login`);
			return;
		}

		if (user.email !== ADMIN_EMAIL) {
			router.push(`/${currentLocale}/dashboard`);
			return;
		}

		await loadData();
		setLoading(false);
	};

	const loadData = async () => {
		// Load all profiles
		const { data: profilesData } = await supabase
			.from('profiles')
			.select('*')
			.order('created_at', { ascending: false });

		setProfiles(profilesData || []);

		// Load verification requests (pending organizers and observers)
		const { data: requestsData } = await supabase
			.from('profiles')
			.select('*')
			.in('role', ['organizer', 'observer'])
			.eq('verification_status', 'pending')
			.order('created_at', { ascending: false });

		setVerificationRequests(requestsData || []);

		// Load all events with organizer info
		const { data: eventsData } = await supabase
			.from('events')
			.select(`
				*,
				organizer:profiles!events_organizer_id_fkey(
					id,
					first_name,
					last_name,
					organization,
					email
				)
			`)
			.order('created_at', { ascending: false });

		setEvents(eventsData || []);
	};

	const handleVerification = async (profileId: string, status: 'approved' | 'rejected') => {
		const { error } = await supabase
			.from('profiles')
			.update({ verification_status: status })
			.eq('id', profileId);

		if (!error) {
			await loadData();
		}
	};

	const handleEventModeration = async (eventId: string, status: 'approved' | 'rejected', reason?: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		
		const updateData: any = {
			moderation_status: status,
			moderated_at: new Date().toISOString(),
			moderated_by: user?.id
		};

		if (status === 'rejected' && reason) {
			updateData.rejection_reason = reason;
		}

		const { error } = await supabase
			.from('events')
			.update(updateData)
			.eq('id', eventId);

		if (!error) {
			await loadData();
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

	return (
		<div className="min-h-screen bg-[#0f0f0f] text-white">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-24 bg-[#1a1a1a] flex flex-col items-center py-6 space-y-12 z-50">
				<div className="w-16 h-16 flex items-center justify-center">
					<Image src="/logo.svg" alt="Logo" width={64} height={64} />
				</div>
				<div className="flex-1 flex flex-col space-y-6 mt-8">
					<button
						onClick={() => setActiveTab('overview')}
						className="w-12 h-12 flex items-center justify-center"
					>
						<span className={`text-2xl ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`}>📊</span>
					</button>
					<button
						onClick={() => setActiveTab('users')}
						className="w-12 h-12 flex items-center justify-center"
					>
						<span className={`text-2xl ${activeTab === 'users' ? 'text-white' : 'text-gray-400'}`}>👥</span>
					</button>
					<button
						onClick={() => setActiveTab('verifications')}
						className="w-12 h-12 flex items-center justify-center relative"
					>
						<span className={`text-2xl ${activeTab === 'verifications' ? 'text-white' : 'text-gray-400'}`}>✓</span>
						{verificationRequests.length > 0 && (
							<span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
								{verificationRequests.length}
							</span>
						)}
					</button>
					<button
						onClick={() => setActiveTab('events')}
						className="w-12 h-12 flex items-center justify-center"
					>
						<span className={`text-2xl ${activeTab === 'events' ? 'text-white' : 'text-gray-400'}`}>📅</span>
					</button>
				</div>
				<button
					onClick={handleLogout}
					className="w-12 h-12 flex items-center justify-center"
				>
					<span className="text-gray-400 text-2xl">🚪</span>
				</button>
			</div>

			{/* Main Content */}
			<div className="ml-24 p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
					<p className="text-gray-400">Welcome back, Administrator</p>
				</div>

				{/* Overview Tab */}
				{activeTab === 'overview' && (
					<div>
						{/* Stats Cards */}
						<div className="grid grid-cols-4 gap-6 mb-8">
							<div className="bg-[#1a1a1a] border border-gray-600 p-6">
								<div className="text-gray-400 text-sm mb-2">Total Users</div>
								<div className="text-4xl font-bold mb-2">{profiles.length}</div>
								<div className="text-green-400 text-sm">↑ Active</div>
							</div>
							<div className="bg-[#1a1a1a] border border-gray-600 p-6">
								<div className="text-gray-400 text-sm mb-2">Participants</div>
								<div className="text-4xl font-bold mb-2 text-blue-400">
									{profiles.filter(p => p.role === 'participant').length}
								</div>
								<div className="text-gray-400 text-sm">Regular users</div>
							</div>
							<div className="bg-[#1a1a1a] border border-gray-600 p-6">
								<div className="text-gray-400 text-sm mb-2">Organizers</div>
								<div className="text-4xl font-bold mb-2 text-purple-400">
									{profiles.filter(p => p.role === 'organizer').length}
								</div>
								<div className="text-gray-400 text-sm">Event creators</div>
							</div>
							<div className="bg-[#1a1a1a] border border-gray-600 p-6">
								<div className="text-gray-400 text-sm mb-2">Pending</div>
								<div className="text-4xl font-bold mb-2 text-yellow-400">
									{verificationRequests.length}
								</div>
								<div className="text-gray-400 text-sm">Awaiting approval</div>
							</div>
						</div>

						{/* Recent Activity */}
						<div className="bg-[#1a1a1a] border border-gray-600 p-6 mb-6">
							<h2 className="text-2xl font-semibold mb-4">Recent Registrations</h2>
							<div className="space-y-3">
								{profiles.slice(0, 5).map((profile) => (
									<div key={profile.id} className="flex items-center justify-between bg-[#0f0f0f] border border-gray-600 p-4">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
												<span className="text-white font-bold">
													{profile.first_name?.[0]?.toUpperCase() || '?'}
												</span>
											</div>
											<div>
												<div className="font-semibold">
													{profile.first_name} {profile.last_name}
												</div>
												<div className="text-sm text-gray-400">
													{profile.role || 'participant'} • {profile.city || 'No city'}
												</div>
											</div>
										</div>
										<div className="text-sm text-gray-400">
											{new Date(profile.created_at).toLocaleDateString()}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Quick Actions */}
						<div className="grid grid-cols-3 gap-6">
							<button
								onClick={() => setActiveTab('verifications')}
								className="bg-[#1a1a1a] border border-gray-600 p-6 hover:bg-[#222] transition-colors text-left"
							>
								<div className="text-3xl mb-3">✓</div>
								<div className="font-semibold mb-1">Review Verifications</div>
								<div className="text-sm text-gray-400">
									{verificationRequests.length} pending requests
								</div>
							</button>
							<button
								onClick={() => setActiveTab('users')}
								className="bg-[#1a1a1a] border border-gray-600 p-6 hover:bg-[#222] transition-colors text-left"
							>
								<div className="text-3xl mb-3">👥</div>
								<div className="font-semibold mb-1">Manage Users</div>
								<div className="text-sm text-gray-400">
									View all {profiles.length} users
								</div>
							</button>
							<button
								onClick={() => setActiveTab('events')}
								className="bg-[#1a1a1a] border border-gray-600 p-6 hover:bg-[#222] transition-colors text-left"
							>
								<div className="text-3xl mb-3">📅</div>
								<div className="font-semibold mb-1">View Events</div>
								<div className="text-sm text-gray-400">
									Monitor all events
								</div>
							</button>
						</div>
					</div>
				)}

				{/* Users Tab */}
				{activeTab === 'users' && (
					<div className="bg-[#1a1a1a] border border-gray-600 p-6">
						<h2 className="text-2xl font-semibold mb-6">All Users</h2>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-600">
										<th className="text-left text-gray-400 py-3 px-4 font-semibold">User</th>
										<th className="text-left text-gray-400 py-3 px-4 font-semibold">Role</th>
										<th className="text-left text-gray-400 py-3 px-4 font-semibold">Status</th>
										<th className="text-left text-gray-400 py-3 px-4 font-semibold">City</th>
										<th className="text-left text-gray-400 py-3 px-4 font-semibold">Joined</th>
									</tr>
								</thead>
								<tbody>
									{profiles.map((profile) => (
										<tr key={profile.id} className="border-b border-gray-700 hover:bg-[#222] transition-colors">
											<td className="py-4 px-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm">
														{profile.first_name?.[0]?.toUpperCase() || '?'}
													</div>
													<div>
														<div className="font-semibold">
															{profile.first_name} {profile.last_name}
														</div>
														<div className="text-sm text-gray-400">{profile.email}</div>
													</div>
												</div>
											</td>
											<td className="py-4 px-4">
												<span className="px-3 py-1 bg-[#2a2a2a] text-sm">
													{profile.role || 'participant'}
												</span>
											</td>
											<td className="py-4 px-4">
												<span className={`px-3 py-1 border text-xs ${
													profile.verification_status === 'approved' ? 'border-green-400 text-green-400' :
													profile.verification_status === 'pending' ? 'border-yellow-400 text-yellow-400' :
													profile.verification_status === 'rejected' ? 'border-red-400 text-red-400' :
													'border-gray-400 text-gray-400'
												}`}>
													{profile.verification_status || 'N/A'}
												</span>
											</td>
											<td className="py-4 px-4 text-gray-400">{profile.city || 'N/A'}</td>
											<td className="py-4 px-4 text-gray-400">
												{new Date(profile.created_at).toLocaleDateString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Verifications Tab */}
				{activeTab === 'verifications' && (
					<div>
						<h2 className="text-2xl font-semibold mb-6">Verification Requests</h2>
						{verificationRequests.length > 0 ? (
							<div className="space-y-4">
								{verificationRequests.map((request) => (
									<div key={request.id} className="bg-[#1a1a1a] border border-gray-600 p-6">
										<div className="flex justify-between items-start mb-4">
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg">
													{request.first_name?.[0]?.toUpperCase() || '?'}
												</div>
												<div>
													<div className="text-xl font-semibold">
														{request.first_name} {request.last_name}
													</div>
													<div className="text-gray-400">
														{request.role} • {request.city || 'No city'}
													</div>
												</div>
											</div>
											<span className="px-3 py-1 border border-yellow-400 text-yellow-400 text-sm">
												PENDING
											</span>
										</div>

										<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
											<div>
												<div className="text-gray-400 mb-1">Organization</div>
												<div>{request.organization || 'N/A'}</div>
											</div>
											<div>
												<div className="text-gray-400 mb-1">Position</div>
												<div>{request.position || 'N/A'}</div>
											</div>
											<div>
												<div className="text-gray-400 mb-1">Experience</div>
												<div>{request.experience || 'N/A'}</div>
											</div>
											<div>
												<div className="text-gray-400 mb-1">Registered</div>
												<div>{new Date(request.created_at).toLocaleDateString()}</div>
											</div>
										</div>

										<div className="flex gap-3">
											<button
												onClick={() => handleVerification(request.id, 'approved')}
												className="px-6 py-2 bg-green-600 hover:bg-green-700 transition-colors"
											>
												✓ Approve
											</button>
											<button
												onClick={() => handleVerification(request.id, 'rejected')}
												className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors"
											>
												✗ Reject
											</button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="bg-[#1a1a1a] border border-gray-600 p-12 text-center">
								<div className="text-6xl mb-4">✓</div>
								<div className="text-xl font-semibold mb-2">All Caught Up!</div>
								<div className="text-gray-400">No pending verification requests</div>
							</div>
						)}
					</div>
				)}

				{/* Events Tab */}
				{activeTab === 'events' && (
					<div>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-semibold">Event Moderation</h2>
							<div className="flex gap-2">
								<button
									onClick={() => setEventFilter('all')}
									className={`px-4 py-2 ${eventFilter === 'all' ? 'bg-purple-600' : 'bg-[#1a1a1a] border border-gray-600'}`}
								>
									All ({events.length})
								</button>
								<button
									onClick={() => setEventFilter('pending')}
									className={`px-4 py-2 ${eventFilter === 'pending' ? 'bg-yellow-600' : 'bg-[#1a1a1a] border border-gray-600'}`}
								>
									Pending ({events.filter(e => e.moderation_status === 'pending').length})
								</button>
								<button
									onClick={() => setEventFilter('approved')}
									className={`px-4 py-2 ${eventFilter === 'approved' ? 'bg-green-600' : 'bg-[#1a1a1a] border border-gray-600'}`}
								>
									Approved ({events.filter(e => e.moderation_status === 'approved').length})
								</button>
								<button
									onClick={() => setEventFilter('rejected')}
									className={`px-4 py-2 ${eventFilter === 'rejected' ? 'bg-red-600' : 'bg-[#1a1a1a] border border-gray-600'}`}
								>
									Rejected ({events.filter(e => e.moderation_status === 'rejected').length})
								</button>
							</div>
						</div>

						{events
							.filter(event => eventFilter === 'all' || event.moderation_status === eventFilter)
							.length > 0 ? (
							<div className="space-y-4">
								{events
									.filter(event => eventFilter === 'all' || event.moderation_status === eventFilter)
									.map((event) => (
										<div key={event.id} className="bg-[#1a1a1a] border border-gray-600 p-6">
											<div className="flex justify-between items-start mb-4">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-xl font-semibold">{event.title}</h3>
														<span className={`px-3 py-1 border text-xs ${
															event.moderation_status === 'approved' ? 'border-green-400 text-green-400' :
															event.moderation_status === 'pending' ? 'border-yellow-400 text-yellow-400' :
															'border-red-400 text-red-400'
														}`}>
															{event.moderation_status?.toUpperCase() || 'PENDING'}
														</span>
													</div>
													<div className="text-gray-400 text-sm mb-3">
														Организатор: {event.organizer?.first_name} {event.organizer?.last_name} 
														{event.organizer?.organization && ` (${event.organizer.organization})`}
													</div>
													<p className="text-gray-300 mb-4">{event.description}</p>
												</div>
											</div>

											<div className="grid grid-cols-4 gap-4 mb-4 text-sm">
												<div>
													<div className="text-gray-400 mb-1">Категория</div>
													<div className="font-semibold">{event.category}</div>
												</div>
												<div>
													<div className="text-gray-400 mb-1">Дата</div>
													<div>{new Date(event.date).toLocaleDateString('ru-RU')}</div>
												</div>
												<div>
													<div className="text-gray-400 mb-1">Локация</div>
													<div>{event.location || 'Не указано'}</div>
												</div>
												<div>
													<div className="text-gray-400 mb-1">Баллы</div>
													<div className="text-purple-400 font-semibold">{event.points_reward} pts</div>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
												<div>
													<div className="text-gray-400 mb-1">Макс. участников</div>
													<div>{event.max_participants || 'Не ограничено'}</div>
												</div>
												<div>
													<div className="text-gray-400 mb-1">Создано</div>
													<div>{new Date(event.created_at).toLocaleDateString('ru-RU')}</div>
												</div>
											</div>

											{event.rejection_reason && (
												<div className="mb-4 p-3 bg-red-900/20 border border-red-600">
													<div className="text-red-400 text-sm font-semibold mb-1">Причина отклонения:</div>
													<div className="text-gray-300 text-sm">{event.rejection_reason}</div>
												</div>
											)}

											{event.moderation_status === 'pending' && (
												<div className="flex gap-3">
													<button
														onClick={() => handleEventModeration(event.id, 'approved')}
														className="px-6 py-2 bg-green-600 hover:bg-green-700 transition-colors"
													>
														✓ Одобрить
													</button>
													<button
														onClick={() => {
															const reason = prompt('Укажите причину отклонения:');
															if (reason) {
																handleEventModeration(event.id, 'rejected', reason);
															}
														}}
														className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors"
													>
														✗ Отклонить
													</button>
												</div>
											)}

											{event.moderation_status === 'approved' && (
												<div className="flex gap-3">
													<button
														onClick={() => {
															const reason = prompt('Укажите причину отклонения:');
															if (reason) {
																handleEventModeration(event.id, 'rejected', reason);
															}
														}}
														className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors"
													>
														Отменить одобрение
													</button>
												</div>
											)}

											{event.moderation_status === 'rejected' && (
												<div className="flex gap-3">
													<button
														onClick={() => handleEventModeration(event.id, 'approved')}
														className="px-6 py-2 bg-green-600 hover:bg-green-700 transition-colors"
													>
														Одобрить
													</button>
												</div>
											)}
										</div>
									))}
							</div>
						) : (
							<div className="bg-[#1a1a1a] border border-gray-600 p-12 text-center">
								<div className="text-6xl mb-4">📅</div>
								<div className="text-xl font-semibold mb-2">Нет мероприятий</div>
								<div className="text-gray-400">
									{eventFilter === 'pending' && 'Нет мероприятий, ожидающих модерации'}
									{eventFilter === 'approved' && 'Нет одобренных мероприятий'}
									{eventFilter === 'rejected' && 'Нет отклоненных мероприятий'}
									{eventFilter === 'all' && 'Мероприятия еще не созданы'}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
