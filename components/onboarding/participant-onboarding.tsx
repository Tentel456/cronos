"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import CityAutocomplete from "./city-autocomplete";

interface ParticipantOnboardingProps {
	onComplete: (data: any) => void;
}

export default function ParticipantOnboarding({ onComplete }: ParticipantOnboardingProps) {
	const currentLocale = useLocale();
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		birthDate: "",
		city: "",
		interests: [] as string[],
		motivation: "",
	});

	const interests = [
		{ id: "it", label: "IT", icon: "💻" },
		{ id: "media", label: currentLocale === "ru" ? "Медиа" : "Media", icon: "📱" },
		{ id: "social", label: currentLocale === "ru" ? "Социальные проекты" : "Social Projects", icon: "🤝" },
		{ id: "politics", label: currentLocale === "ru" ? "Политика" : "Politics", icon: "🏛️" },
	];

	const motivations = [
		{ id: "reserve", label: currentLocale === "ru" ? "Попасть в кадровый резерв" : "Join talent pool", icon: "🎯" },
		{ id: "internship", label: currentLocale === "ru" ? "Получить стажировку" : "Get internship", icon: "💼" },
		{ id: "skills", label: currentLocale === "ru" ? "Развивать навыки" : "Develop skills", icon: "📈" },
	];

	const handleInterestToggle = (interestId: string) => {
		setFormData(prev => ({
			...prev,
			interests: prev.interests.includes(interestId)
				? prev.interests.filter(i => i !== interestId)
				: [...prev.interests, interestId]
		}));
	};

	const handleNext = () => {
		if (step < 4) setStep(step + 1);
	};

	const handleBack = () => {
		if (step > 1) setStep(step - 1);
	};

	const handleComplete = () => {
		onComplete(formData);
	};

	return (
		<div className="max-w-2xl mx-auto">
			{/* Progress bar */}
			<div className="mb-8">
				<div className="flex justify-between mb-2">
					{[1, 2, 3, 4].map((s) => (
						<div
							key={s}
							className={`w-1/4 h-2 rounded-full mx-1 ${
								s <= step ? "bg-[#4A7C59]" : "bg-gray-200"
							}`}
						/>
					))}
				</div>
				<p className="text-sm text-[#260A2F]/60 text-center">
					{currentLocale === "ru" ? `Шаг ${step} из 4` : `Step ${step} of 4`}
				</p>
			</div>

			{/* Step 1: Basic Info */}
			{step === 1 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-[#260A2F] mb-6">
						{currentLocale === "ru" ? "Базовая информация" : "Basic Information"}
					</h2>
					
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-[#260A2F] mb-2">
								{currentLocale === "ru" ? "Имя" : "First Name"}
							</label>
							<input
								type="text"
								value={formData.firstName}
								onChange={(e) => setFormData({...formData, firstName: e.target.value})}
								className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
								placeholder={currentLocale === "ru" ? "Иван" : "John"}
							/>
						</div>
						<div>
							<label className="block text-sm text-[#260A2F] mb-2">
								{currentLocale === "ru" ? "Фамилия" : "Last Name"}
							</label>
							<input
								type="text"
								value={formData.lastName}
								onChange={(e) => setFormData({...formData, lastName: e.target.value})}
								className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
								placeholder={currentLocale === "ru" ? "Иванов" : "Doe"}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-[#260A2F] mb-2">
							{currentLocale === "ru" ? "Дата рождения" : "Date of Birth"}
						</label>
						<input
							type="date"
							value={formData.birthDate}
							onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
							className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
						/>
					</div>

					<div>
						<label className="block text-sm text-[#260A2F] mb-2">
							{currentLocale === "ru" ? "Город" : "City"}
						</label>
						<CityAutocomplete
							value={formData.city}
							onChange={(city) => setFormData({...formData, city})}
						/>
					</div>
				</div>
			)}

			{/* Step 2: Interests */}
			{step === 2 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Направления интересов" : "Areas of Interest"}
					</h2>
					<p className="text-[#260A2F]/60 mb-6">
						{currentLocale === "ru" ? "Выберите области, которые вам интересны" : "Select areas that interest you"}
					</p>

					<div className="grid grid-cols-2 gap-4">
						{interests.map((interest) => (
							<button
								key={interest.id}
								onClick={() => handleInterestToggle(interest.id)}
								className={`p-6 rounded-xl border-2 transition-all ${
									formData.interests.includes(interest.id)
										? "border-[#4A7C59] bg-[#4A7C59]/10"
										: "border-[#260A2F]/10 hover:border-[#4A7C59]/50"
								}`}>
								<div className="text-4xl mb-2">{interest.icon}</div>
								<div className="font-semibold text-[#260A2F]">
									{interest.label}
								</div>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Step 3: Motivation */}
			{step === 3 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-[#260A2F] mb-2">
						{currentLocale === "ru" ? "Чего вы хотите достичь?" : "What do you want to achieve?"}
					</h2>
					<p className="text-[#260A2F]/60 mb-6">
						{currentLocale === "ru" ? "Это поможет нам персонализировать ваш опыт" : "This will help us personalize your experience"}
					</p>

					<div className="space-y-4">
						{motivations.map((motivation) => (
							<button
								key={motivation.id}
								onClick={() => setFormData({...formData, motivation: motivation.id})}
								className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
									formData.motivation === motivation.id
										? "border-[#4A7C59] bg-[#4A7C59]/10"
										: "border-[#260A2F]/10 hover:border-[#4A7C59]/50"
								}`}>
								<div className="text-3xl">{motivation.icon}</div>
								<div className="font-semibold text-[#260A2F]">
									{motivation.label}
								</div>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Step 4: Final */}
			{step === 4 && (
				<div className="text-center space-y-6">
					<div className="text-6xl mb-4">🎉</div>
					<h2 className="text-3xl font-bold text-[#260A2F]">
						{currentLocale === "ru" ? "Вы готовы начать!" : "You're ready to start!"}
					</h2>
					<p className="text-[#260A2F]/60">
						{currentLocale === "ru" ? "Все настроено. Добро пожаловать на платформу!" : "All set. Welcome to the platform!"}
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
				{step < 4 ? (
					<button
						onClick={handleNext}
						className="px-6 py-3 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6449] transition-colors">
						{currentLocale === "ru" ? "Далее" : "Next"}
					</button>
				) : (
					<button
						onClick={handleComplete}
						className="px-8 py-3 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6449] transition-colors font-semibold">
						{currentLocale === "ru" ? "Перейти в платформу" : "Go to Platform"}
					</button>
				)}
			</div>
		</div>
	);
}
