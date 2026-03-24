"use client";
import { useLocale } from "next-intl";

interface RoleSelectionProps {
	onSelectRole: (role: "participant" | "organizer" | "observer") => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
	const currentLocale = useLocale();

	const roles = [
		{
			id: "participant",
			icon: "🧑‍🎓",
			title: currentLocale === "ru" ? "Участник" : "Participant",
			description: currentLocale === "ru" 
				? "Участвуйте в мероприятиях и развивайте навыки"
				: "Participate in events and develop skills",
		},
		{
			id: "organizer",
			icon: "🧑‍💼",
			title: currentLocale === "ru" ? "Организатор" : "Organizer",
			description: currentLocale === "ru"
				? "Создавайте и управляйте мероприятиями"
				: "Create and manage events",
		},
		{
			id: "observer",
			icon: "🏛",
			title: currentLocale === "ru" ? "Наблюдатель" : "Observer",
			description: currentLocale === "ru"
				? "Следите за процессом и анализируйте"
				: "Monitor process and analyze",
		},
	];

	return (
		<div className="text-center max-w-4xl mx-auto">
			<h2 className="text-3xl font-bold text-[#260A2F] mb-3">
				{currentLocale === "ru" ? "Кто вы?" : "Who are you?"}
			</h2>
			<p className="text-[#260A2F]/70 mb-8 text-base">
				{currentLocale === "ru" 
					? "Выберите роль, чтобы мы могли персонализировать ваш опыт"
					: "Choose your role to personalize your experience"}
			</p>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{roles.map((role) => (
					<button
						key={role.id}
						onClick={() => onSelectRole(role.id as any)}
						className="relative bg-white p-6 rounded-2xl border-2 border-[#260A2F]/10 hover:border-[#4A7C59] hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1">
						<div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
							{role.icon}
						</div>
						<h3 className="text-xl font-bold text-[#260A2F] mb-2">
							{role.title}
						</h3>
						<p className="text-[#260A2F]/70 text-sm leading-relaxed">
							{role.description}
						</p>
						<div className="absolute inset-0 bg-gradient-to-br from-[#4A7C59]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
					</button>
				))}
			</div>
		</div>
	);
}
