"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function ProfilePage() {
	const router = useRouter();
	const currentLocale = useLocale();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<any>(null);
	const [projects, setProjects] = useState<any[]>([]);
	const [showAddProject, setShowAddProject] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [editingProfile, setEditingProfile] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [username, setUsername] = useState('');
	const [newProject, setNewProject] = useState({
		title: '',
		description: '',
		image_url: '',
		project_url: ''
	});

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
		setUsername(profile?.username || '');

		// Load user projects
		const { data: projectsData } = await supabase
			.from('projects')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		setProjects(projectsData || []);
		setLoading(false);
	};

	const handleAddProject = async () => {
		if (!newProject.title || !user) return;

		setUploading(true);

		const { error } = await supabase
			.from('projects')
			.insert([{
				user_id: user.id,
				...newProject
			}]);

		if (!error) {
			setNewProject({ title: '', description: '', image_url: '', project_url: '' });
			setImagePreview('');
			setShowAddProject(false);
			checkUser(); // Reload projects
		}
		setUploading(false);
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;

		setUploading(true);

		// Create unique filename
		const fileExt = file.name.split('.').pop();
		const fileName = `${user.id}/${Date.now()}.${fileExt}`;

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage
			.from('project-images')
			.upload(fileName, file);

		if (!error && data) {
			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('project-images')
				.getPublicUrl(fileName);

			setNewProject({ ...newProject, image_url: publicUrl });
			setImagePreview(publicUrl);
		}

		setUploading(false);
	};

	const handleDeleteProject = async (projectId: string) => {
		const { error } = await supabase
			.from('projects')
			.delete()
			.eq('id', projectId);

		if (!error) {
			checkUser(); // Reload projects
		}
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;

		setUploadingAvatar(true);

		// Create unique filename
		const fileExt = file.name.split('.').pop();
		const fileName = `${user.id}/${Date.now()}.${fileExt}`;

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage
			.from('avatars')
			.upload(fileName, file);

		if (!error && data) {
			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('avatars')
				.getPublicUrl(fileName);

			// Update profile with new avatar URL
			await supabase
				.from('profiles')
				.update({ avatar_url: publicUrl })
				.eq('id', user.id);

			// Refresh profile
			checkUser();
		}

		setUploadingAvatar(false);
	};

	const handleUsernameUpdate = async () => {
		if (!user || !username.trim()) return;

		const { error } = await supabase
			.from('profiles')
			.update({ username: username.trim() })
			.eq('id', user.id);

		if (!error) {
			setEditingProfile(false);
			checkUser();
		} else {
			alert('Username already taken or invalid');
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
					<button className="w-10 h-10 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center">
						<span className="text-gray-400">⚙️</span>
					</button>
				</Link>
			</div>

			{/* Main Content */}
			<div className="ml-16 p-8">
				{/* Hero Profile Card */}
				<div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-3xl p-8 mb-8 relative overflow-hidden">
					<div className="relative z-10 flex items-center gap-6">
						<div className="relative">
							<label className="cursor-pointer group">
								<input
									type="file"
									accept="image/*"
									onChange={handleAvatarUpload}
									className="hidden"
									disabled={uploadingAvatar}
								/>
								<div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-4xl overflow-hidden relative">
									{profile?.avatar_url ? (
										<img
											src={profile.avatar_url}
											alt="Avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										<span>{profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span>
									)}
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										{uploadingAvatar ? (
											<span className="text-sm">⏳</span>
										) : (
											<span className="text-sm">📷</span>
										)}
									</div>
								</div>
							</label>
						</div>
						<div className="flex-1">
							<h2 className="text-4xl font-bold mb-2">
								{profile?.first_name} {profile?.last_name}
							</h2>
							<p className="text-purple-300 text-lg mb-2">{user?.email}</p>
							{editingProfile ? (
								<div className="flex items-center gap-2">
									<input
										type="text"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder="Enter username"
										className="bg-[#0f0f0f] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
									/>
									<button
										onClick={handleUsernameUpdate}
										className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
										Save
									</button>
									<button
										onClick={() => {
											setEditingProfile(false);
											setUsername(profile?.username || '');
										}}
										className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
										Cancel
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<p className="text-gray-400">
										@{profile?.username || 'No username set'}
									</p>
									<button
										onClick={() => setEditingProfile(true)}
										className="text-purple-400 hover:text-purple-300 text-sm">
										Edit
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Info Cards Grid */}
				<div className="grid grid-cols-4 gap-4 mb-8">
					{/* Role Card */}
					<div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6">
						<div className="text-purple-200 text-sm mb-2">Role</div>
						<div className="text-white text-2xl font-bold capitalize">{profile?.role || 'N/A'}</div>
					</div>

					{/* City Card */}
					<div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6">
						<div className="text-blue-200 text-sm mb-2">City</div>
						<div className="text-white text-2xl font-bold">{profile?.city || 'N/A'}</div>
					</div>

					{/* Birth Date Card */}
					{profile?.birth_date && (
						<div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl p-6">
							<div className="text-pink-200 text-sm mb-2">Birth Date</div>
							<div className="text-white text-xl font-bold">{new Date(profile.birth_date).toLocaleDateString()}</div>
						</div>
					)}

					{/* Verification Status Card */}
					<div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6">
						<div className="text-green-200 text-sm mb-2">Status</div>
						<div className="text-white text-xl font-bold capitalize">{profile?.verification_status || 'Active'}</div>
					</div>
				</div>

				{/* Interests Section */}
				{profile?.interests && profile.interests.length > 0 && (
					<div className="mb-8">
						<h3 className="text-2xl font-bold mb-4">Interests</h3>
						<div className="grid grid-cols-4 gap-4">
							{profile.interests.map((interest: string, idx: number) => (
								<div
									key={idx}
									className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-center">
									<div className="text-white text-lg font-semibold">{interest}</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Motivation Card */}
				{profile?.motivation && (
					<div className="mb-8">
						<h3 className="text-2xl font-bold mb-4">Motivation</h3>
						<div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-8">
							<p className="text-gray-300 text-lg">{profile.motivation}</p>
						</div>
					</div>
				)}

				{/* Organization Info */}
				{(profile?.role === 'organizer' || profile?.role === 'observer') && profile?.organization && (
					<div className="mb-8">
						<h3 className="text-2xl font-bold mb-4">Organization</h3>
						<div className="grid grid-cols-3 gap-4">
							<div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6">
								<div className="text-orange-200 text-sm mb-2">Organization</div>
								<div className="text-white text-xl font-bold">{profile.organization}</div>
							</div>
							{profile.position && (
								<div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6">
									<div className="text-teal-200 text-sm mb-2">Position</div>
									<div className="text-white text-xl font-bold">{profile.position}</div>
								</div>
							)}
							{profile.experience && (
								<div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-6">
									<div className="text-cyan-200 text-sm mb-2">Experience</div>
									<div className="text-white text-xl font-bold">{profile.experience}</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Portfolio Section */}
				<div className="mb-8">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-2xl font-bold">Portfolio</h3>
						<button
							onClick={() => setShowAddProject(true)}
							className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
							+ Add Project
						</button>
					</div>

					{/* Add Project Modal */}
					{showAddProject && (
						<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
							<div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
								<div className="flex justify-between items-center mb-6">
									<h3 className="text-3xl font-bold">Add New Project</h3>
									<button
										onClick={() => {
											setShowAddProject(false);
											setImagePreview('');
											setNewProject({ title: '', description: '', image_url: '', project_url: '' });
										}}
										className="text-gray-400 hover:text-white text-3xl">
										×
									</button>
								</div>

								<div className="space-y-6">
									{/* Image Upload */}
									<div>
										<label className="text-sm text-gray-400 mb-3 block">Project Image</label>
										<div className="relative">
											{imagePreview ? (
												<div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f0f0f]">
													<img
														src={imagePreview}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
													<button
														onClick={() => {
															setImagePreview('');
															setNewProject({ ...newProject, image_url: '' });
														}}
														className="absolute top-4 right-4 w-10 h-10 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center">
														×
													</button>
												</div>
											) : (
												<label className="block aspect-video rounded-2xl border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors cursor-pointer bg-[#0f0f0f]">
													<input
														type="file"
														accept="image/*"
														onChange={handleImageUpload}
														className="hidden"
														disabled={uploading}
													/>
													<div className="h-full flex flex-col items-center justify-center text-gray-400">
														{uploading ? (
															<>
																<div className="text-5xl mb-4">⏳</div>
																<p className="text-lg">Uploading...</p>
															</>
														) : (
															<>
																<div className="text-5xl mb-4">📸</div>
																<p className="text-lg mb-2">Click to upload or drag and drop</p>
																<p className="text-sm">PNG, JPG, GIF up to 10MB</p>
															</>
														)}
													</div>
												</label>
											)}
										</div>
									</div>

									{/* Project Title */}
									<div>
										<label className="text-sm text-gray-400 mb-3 block">Project Title *</label>
										<input
											type="text"
											value={newProject.title}
											onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
											className="w-full bg-[#0f0f0f] text-white px-6 py-4 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
											placeholder="Enter project title"
										/>
									</div>

									{/* Description */}
									<div>
										<label className="text-sm text-gray-400 mb-3 block">Description</label>
										<textarea
											value={newProject.description}
											onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
											className="w-full bg-[#0f0f0f] text-white px-6 py-4 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
											placeholder="Describe your project..."
											rows={4}
										/>
									</div>

									{/* Project URL */}
									<div>
										<label className="text-sm text-gray-400 mb-3 block">Project URL (optional)</label>
										<input
											type="url"
											value={newProject.project_url}
											onChange={(e) => setNewProject({ ...newProject, project_url: e.target.value })}
											className="w-full bg-[#0f0f0f] text-white px-6 py-4 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
											placeholder="https://your-project.com"
										/>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-4 mt-8">
									<button
										onClick={handleAddProject}
										disabled={!newProject.title || uploading}
										className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
										{uploading ? 'Uploading...' : 'Add Project'}
									</button>
									<button
										onClick={() => {
											setShowAddProject(false);
											setImagePreview('');
											setNewProject({ title: '', description: '', image_url: '', project_url: '' });
										}}
										className="px-8 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold">
										Cancel
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Projects Grid */}
					<div className="grid grid-cols-3 gap-6">
						{projects.map((project) => (
							<div key={project.id} className="bg-[#1a1a1a] rounded-2xl overflow-hidden group relative">
								{/* Project Image */}
								<div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 relative">
									{project.image_url ? (
										<img
											src={project.image_url}
											alt={project.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-white text-4xl">
											📁
										</div>
									)}
									{/* Delete Button */}
									<button
										onClick={() => handleDeleteProject(project.id)}
										className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										×
									</button>
								</div>
								{/* Project Info */}
								<div className="p-4">
									<h4 className="text-lg font-semibold mb-2">{project.title}</h4>
									{project.description && (
										<p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
									)}
									{project.project_url && (
										<a
											href={project.project_url.startsWith('http') ? project.project_url : `https://${project.project_url}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-purple-400 text-sm hover:text-purple-300 transition-colors inline-block">
											View Project →
										</a>
									)}
								</div>
							</div>
						))}

						{/* Empty State */}
						{projects.length === 0 && (
							<div className="col-span-3 bg-[#1a1a1a] rounded-2xl p-12 text-center">
								<div className="text-6xl mb-4">📂</div>
								<h4 className="text-xl font-semibold mb-2">No projects yet</h4>
								<p className="text-gray-400 mb-6">Start building your portfolio by adding your first project</p>
								<button
									onClick={() => setShowAddProject(true)}
									className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
									Add Your First Project
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Back Button */}
				<Link href={`/${currentLocale}/dashboard`}>
					<button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
						Back to Dashboard
					</button>
				</Link>
			</div>
		</div>
	);
}
