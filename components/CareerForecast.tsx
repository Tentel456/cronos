"use client";
import { getCurrentLevel, getNextLevel, getProgressToNextLevel, getPointsToNextLevel, getRecommendations } from "@/lib/careerLevels";

interface CareerForecastProps {
	rating: number;
	eventsAttended: number;
}

export default function CareerForecast({ rating, eventsAttended }: CareerForecastProps) {
	const currentLevel = getCurrentLevel(rating);
	const nextLevel = getNextLevel(rating);
	const progress = getProgressToNextLevel(rating);
	const pointsNeeded = getPointsToNextLevel(rating);
	const recommendations = getRecommendations(rating, eventsAttended);

	return (
		<div className="space-y-6">
			{/* Current Level Card */}
			<div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<div className="text-sm text-gray-200 mb-1">Текущий уровень</div>
						<div className={`text-3xl font-bold ${currentLevel.color}`}>
							{currentLevel.nameRu}
						</div>
					</div>
					<div className="text-right">
						<div className="text-sm text-gray-200 mb-1">Рейтинг</div>
						<div className="text-3xl font-bold text-white">
							{rating}
						</div>
					</div>
				</div>

				{/* Benefits */}
				<div className="bg-black/20 p-4 rounded">
					<div className="text-sm font-semibold mb-2">Ваши преимущества:</div>
					<ul className="space-y-1 text-sm">
						{currentLevel.benefits.map((benefit, index) => (
							<li key={index} className="flex items-start gap-2">
								<span className="text-green-400 mt-0.5">✓</span>
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Progress to Next Level */}
			{nextLevel ? (
				<div className="bg-[#1a1a1a] border border-gray-600 p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<div className="text-sm text-gray-400 mb-1">Следующий уровень</div>
							<div className={`text-2xl font-bold ${nextLevel.color}`}>
								{nextLevel.nameRu}
							</div>
						</div>
						<div className="text-right">
							<div className="text-sm text-gray-400 mb-1">Осталось баллов</div>
							<div className="text-2xl font-bold text-orange-400">
								{pointsNeeded}
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="mb-4">
						<div className="flex justify-between text-sm text-gray-400 mb-2">
							<span>Прогресс</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<div className="w-full bg-[#0f0f0f] h-4 border border-gray-600">
							<div
								className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					{/* Next Level Benefits Preview */}
					<div className="bg-[#0f0f0f] border border-gray-600 p-4">
						<div className="text-sm font-semibold mb-2 text-gray-300">
							Что вы получите на уровне "{nextLevel.nameRu}":
						</div>
						<ul className="space-y-1 text-sm text-gray-400">
							{nextLevel.benefits.map((benefit, index) => (
								<li key={index} className="flex items-start gap-2">
									<span className="text-purple-400 mt-0.5">→</span>
									<span>{benefit}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			) : (
				<div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-center">
					<div className="text-4xl mb-2">🏆</div>
					<div className="text-2xl font-bold mb-2">Поздравляем!</div>
					<p className="text-lg">
						Вы достигли максимального уровня "Чемпион"!
					</p>
					<p className="text-sm mt-2 opacity-90">
						Продолжайте участвовать в мероприятиях для поддержания статуса
					</p>
				</div>
			)}

			{/* Recommendations */}
			<div className="bg-[#1a1a1a] border border-gray-600 p-6">
				<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
					<span>💡</span>
					<span>Рекомендации для роста</span>
				</h3>
				<div className="space-y-3">
					{recommendations.map((recommendation, index) => (
						<div key={index} className="flex items-start gap-3 bg-[#0f0f0f] border border-gray-600 p-4">
							<div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
								{index + 1}
							</div>
							<p className="text-gray-300">{recommendation}</p>
						</div>
					))}
				</div>
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-[#1a1a1a] border border-gray-600 p-4 text-center">
					<div className="text-2xl font-bold text-purple-400">{eventsAttended}</div>
					<div className="text-sm text-gray-400 mt-1">Посещено событий</div>
				</div>
				<div className="bg-[#1a1a1a] border border-gray-600 p-4 text-center">
					<div className="text-2xl font-bold text-blue-400">
						{Math.round((rating / (nextLevel?.minPoints || rating)) * 100)}%
					</div>
					<div className="text-sm text-gray-400 mt-1">До следующего уровня</div>
				</div>
				<div className="bg-[#1a1a1a] border border-gray-600 p-4 text-center">
					<div className="text-2xl font-bold text-green-400">
						{nextLevel ? Math.ceil(pointsNeeded / 50) : 0}
					</div>
					<div className="text-sm text-gray-400 mt-1">Событий до цели</div>
				</div>
			</div>

			{/* Career Reserve Status */}
			<div className={`p-6 border-2 ${
				rating >= 1001 
					? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500' 
					: rating >= 601
					? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500'
					: 'bg-[#1a1a1a] border-gray-600'
			}`}>
				<div className="flex items-center gap-3 mb-3">
					<span className="text-3xl">
						{rating >= 1001 ? '🌟' : rating >= 601 ? '⭐' : '📊'}
					</span>
					<div>
						<div className="text-lg font-bold">
							{rating >= 1001 
								? 'Вы в кадровом резерве!' 
								: rating >= 601
								? 'Вы близки к кадровому резерву'
								: 'Статус кадрового резерва'}
						</div>
						<div className="text-sm text-gray-400">
							{rating >= 1001 
								? 'Автоматическое попадание в кадровый резерв' 
								: rating >= 601
								? `Еще ${1001 - rating} баллов до автоматического попадания`
								: `Наберите ${1001 - rating} баллов для попадания в резерв`}
						</div>
					</div>
				</div>

				{rating >= 1001 && (
					<div className="bg-black/30 p-4 rounded">
						<p className="text-sm">
							<strong>Ваши привилегии:</strong> Прямые рекомендации на руководящие должности, 
							персональный карьерный консультант, участие в международных программах, 
							именная стипендия.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
