"use client";
import { useState } from "react";
import { useLocale } from "next-intl";

interface OrganizerOnboardingProps {
	onComplete: (data: any) => void;
}

export default function OrganizerOnboarding({ onComplete }: OrganizerOnboardingProps) {
	const currentLocale = useLocale();
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		firstName: "",
		organization: "",
		position: "",
		experience: "",
		eventTypes: [] as string[],
	});

	const eventTypes = [
		{ id: "conference", label: currentLocale === "ru" ? "Конференции" : "Conferences", icon: "🎤" },
		{ id: "workshop", label: currentLocale === "ru" ? "Воркшопы" : "Workshops", icon: "🛠️" },
		{ id: "hackathon", label: currentLocale === "ru" ? "Хакатоны" : "Hackathons", icon: "💻" },
		{ id: "meetup", label: currentLocale === "ru" ? "Митапы" : "Meetups", icon: "☕" },
	];

	const handleEventTypeToggle = (typeId: string) => {
		setFormData(prev => ({
			...prev,
			eventTypes: prev.eventTypes.includes(typeId)
				? prev.eventTypes.filter(t => t !== typeId)
				: [...prev.eventTypes, typeId]
		}));
	};

	const handleNext = () => {
		if (step < 3) setStep(step + 1);
	};

	const handleBack = () => {
		if (step > 1) setStep(step - 1);
	};

	const handleComplete = () => {
		onComplete({ 
			...formData, 
			verification_status: "pending"  // Changed from status to verification_status
		});
	};

	return (
		<div className="max-w-2xl mx-auto">
			{/* Progress bar */}
			<div className="mb-8">
				<div className="flex justify-between mb-2">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`w-1/3 h-2 rounded-full mx-1 ${
								s <= step ? "bg-[#4A7C59]" : "bg-gray-200"
							}`}
						/>
					))}
				</div>
				<p className="text-sm text-[#260A2F]/60 text-center">
					{currentLocale === "ru" ? `Шаг ${step} из 3` : `Step ${step} of 3`}
				</p>
			</div>

			{/* Step 1: Basic Info */}
			{step === 1 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-[#260A2F] mb-6">
						{currentLocale === "ru" ? "Основная информация" : "Basic Information"}
					</h2>
					
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
							{currentLocale === "ru" ? "Должность" : "Position"}
						</label>
						<input
							type="text"
							value={formData.position}
							onChange={(e) => setFormData({...formData, position: e.target.value})}
							className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
							placeholder={currentLocale === "ru" ? "Менеджер проектов" : "Project Manager"}
						/>
					</div>
				</div>
			)}

			{/* Step 2: Experience */}
			{step === 2 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Опыт и специализация" : "Experience & Specialization"}
					</h2>
					<p className="text-[#260A2F]/60 mb-6">
						{currentLocale === "ru" ? "Расскажите о вашем опыте (опционально)" : "Tell us about your experience (optional)"}
					</p>

					<div>
						<label className="block text-sm text-[#260A2F] mb-2">
							{currentLocale === "ru" ? "Опыт организации мероприятий" : "Event Organization Experience"}
						</label>
						<textarea
							value={formData.experience}
							onChange={(e) => setFormData({...formData, experience: e.target.value})}
							className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] min-h-[120px]"
							placeholder={currentLocale === "ru" ? "Опишите ваш опыт..." : "Describe your experience..."}
						/>
					</div>

					<div>
						<label className="block text-sm text-[#260A2F] mb-4">
							{currentLocale === "ru" ? "Типы мероприятий" : "Event Types"}
						</label>
						<div className="grid grid-cols-2 gap-4">
							{eventTypes.map((type) => (
								<button
									key={type.id}
									onClick={() => handleEventTypeToggle(type.id)}
									className={`p-4 rounded-xl border-2 transition-all ${
										formData.eventTypes.includes(type.id)
											? "border-[#4A7C59] bg-[#4A7C59]/10"
											: "border-[#260A2F]/10 hover:border-[#4A7C59]/50"
									}`}>
									<div className="text-3xl mb-2">{type.icon}</div>
									<div className="font-semibold text-[#260A2F] text-sm">
										{type.label}
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Step 3: Verification */}
			{step === 3 && (
				<div className="text-center space-y-6">
					<div className="text-6xl mb-4">⏳</div>
					<h2 className="text-3xl font-bold text-[#260A2F]">
						{currentLocale === "ru" ? "Подтверждение аккаунта" : "Account Verification"}
					</h2>
					<div className="bg-[#FFD7EF]/30 p-6 rounded-xl">
						<p className="text-[#260A2F] mb-4">
							{currentLocale === "ru" 
								? "Ваша заявка будет отправлена на модерацию"
								: "Your application will be sent for moderation"}
						</p>
						<div className="inline-block px-4 py-2 bg-[#FFC091] rounded-full text-[#260A2F] font-semibold">
							{currentLocale === "ru" ? "Статус: На проверке" : "Status: Under Review"}
						</div>
					</div>
					<p className="text-[#260A2F]/60 text-sm">
						{currentLocale === "ru" 
							? "Мы проверим вашу информацию и свяжемся с вами в течение 24 часов"
							: "We'll review your information and contact you within 24 hours"}
					</p>
				</div>
			)}

			{/* Navigation */}
			<div className="flex justify-between mt-8">
				{step > 1 && (
					<button
						onClick={handleBack}
						className="px-6 py-3 border-2 border-[#260A2F] text-[#260A2F] rounded-lg hover:bg-[#260A2F] hover:text-white transition-colors">
						{currentLocale === "ru" ? "Назад" : "Back"}
					</button>
				)}
				<div className="flex-1" />
				{step < 3 ? (
					<button
						onClick={handleNext}
						className="px-6 py-3 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6449] transition-colors">
						{currentLocale === "ru" ? "Далее" : "Next"}
					</button>
				) : (
					<button
						onClick={handleComplete}
						className="px-8 py-3 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6449] transition-colors font-semibold">
						{currentLocale === "ru" ? "Отправить на проверку" : "Submit for Review"}
					</button>
				)}
			</div>
		</div>
	);
}
