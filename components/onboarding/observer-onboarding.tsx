"use client";
import { useState } from "react";
import { useLocale } from "next-intl";

interface ObserverOnboardingProps {
	onComplete: (data: any) => void;
}

export default function ObserverOnboarding({ onComplete }: ObserverOnboardingProps) {
	const currentLocale = useLocale();
	const [formData, setFormData] = useState({
		firstName: "",
		organization: "",
		role: "",
	});

	const handleComplete = () => {
		onComplete({ 
			...formData, 
			verification_status: "pending"  // Changed from status to verification_status
		});
	};

	return (
		<div className="max-w-2xl mx-auto">
			<div className="space-y-6">
				<div className="text-center mb-8">
					<div className="text-6xl mb-4">🏛</div>
					<h2 className="text-2xl font-bold text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Регистрация наблюдателя" : "Observer Registration"}
					</h2>
					<p className="text-[#260A2F]/60">
						{currentLocale === "ru" 
							? "Минимум информации для быстрого доступа"
							: "Minimal information for quick access"}
					</p>
				</div>
				
				<div>
					<label className="block text-sm text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Имя" : "Name"}
					</label>
					<input
						type="text"
						value={formData.firstName}
						onChange={(e) => setFormData({...formData, firstName: e.target.value})}
						className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
						placeholder={currentLocale === "ru" ? "Иван Иванов" : "John Doe"}
					/>
				</div>

				<div>
					<label className="block text-sm text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Организация" : "Organization"}
					</label>
					<input
						type="text"
						value={formData.organization}
						onChange={(e) => setFormData({...formData, organization: e.target.value})}
						className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
						placeholder={currentLocale === "ru" ? "Название организации" : "Organization name"}
					/>
				</div>

				<div>
					<label className="block text-sm text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Роль" : "Role"}
					</label>
					<input
						type="text"
						value={formData.role}
						onChange={(e) => setFormData({...formData, role: e.target.value})}
						className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
						placeholder={currentLocale === "ru" ? "Аналитик / Эксперт" : "Analyst / Expert"}
					/>
				</div>

				<div className="bg-[#9FE870]/20 p-4 rounded-lg">
					<p className="text-sm text-[#260A2F]">
						💡 {currentLocale === "ru" 
							? "Ваш аккаунт будет проверен администратором перед предоставлением доступа"
							: "Your account will be reviewed by an administrator before granting access"}
					</p>
				</div>

				<button
					onClick={handleComplete}
					className="w-full py-3 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6449] transition-colors font-semibold">
					{currentLocale === "ru" ? "Отправить заявку" : "Submit Application"}
				</button>
			</div>
		</div>
	);
}
