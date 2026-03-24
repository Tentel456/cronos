// Career Reserve Levels System

export interface CareerLevel {
	name: string;
	nameRu: string;
	minPoints: number;
	maxPoints: number;
	color: string;
	benefits: string[];
}

export const CAREER_LEVELS: CareerLevel[] = [
	{
		name: 'Newcomer',
		nameRu: 'Новичок',
		minPoints: 0,
		maxPoints: 100,
		color: 'text-gray-400',
		benefits: [
			'Доступ к базовым мероприятиям',
			'Участие в общих проектах'
		]
	},
	{
		name: 'Active Member',
		nameRu: 'Активный участник',
		minPoints: 101,
		maxPoints: 300,
		color: 'text-blue-400',
		benefits: [
			'Приоритетная регистрация на события',
			'Доступ к закрытым мероприятиям',
			'Сертификат активного участника'
		]
	},
	{
		name: 'Expert',
		nameRu: 'Эксперт',
		minPoints: 301,
		maxPoints: 600,
		color: 'text-purple-400',
		benefits: [
			'Возможность выступать на мероприятиях',
			'Менторство новичков',
			'Рекомендательное письмо',
			'Доступ к стажировкам'
		]
	},
	{
		name: 'Leader',
		nameRu: 'Лидер',
		minPoints: 601,
		maxPoints: 1000,
		color: 'text-orange-400',
		benefits: [
			'Организация собственных мероприятий',
			'Участие в управлении парламентом',
			'Приоритет при отборе на должности',
			'Грант на реализацию проекта'
		]
	},
	{
		name: 'Champion',
		nameRu: 'Чемпион',
		minPoints: 1001,
		maxPoints: Infinity,
		color: 'text-yellow-400',
		benefits: [
			'Автоматическое попадание в кадровый резерв',
			'Прямые рекомендации на руководящие должности',
			'Персональный карьерный консультант',
			'Участие в международных программах',
			'Именная стипендия'
		]
	}
];

export const getCurrentLevel = (points: number): CareerLevel => {
	return CAREER_LEVELS.find(level => 
		points >= level.minPoints && points <= level.maxPoints
	) || CAREER_LEVELS[0];
};

export const getNextLevel = (points: number): CareerLevel | null => {
	const currentLevel = getCurrentLevel(points);
	const currentIndex = CAREER_LEVELS.indexOf(currentLevel);
	
	if (currentIndex < CAREER_LEVELS.length - 1) {
		return CAREER_LEVELS[currentIndex + 1];
	}
	
	return null; // Already at max level
};

export const getProgressToNextLevel = (points: number): number => {
	const currentLevel = getCurrentLevel(points);
	const nextLevel = getNextLevel(points);
	
	if (!nextLevel) return 100; // Max level reached
	
	const pointsInCurrentLevel = points - currentLevel.minPoints;
	const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
	
	return Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
};

export const getPointsToNextLevel = (points: number): number => {
	const nextLevel = getNextLevel(points);
	
	if (!nextLevel) return 0; // Max level reached
	
	return nextLevel.minPoints - points;
};

export const getRecommendations = (points: number, eventsAttended: number): string[] => {
	const recommendations: string[] = [];
	const currentLevel = getCurrentLevel(points);
	const nextLevel = getNextLevel(points);
	
	if (!nextLevel) {
		recommendations.push('Поздравляем! Вы достигли максимального уровня!');
		recommendations.push('Продолжайте участвовать в мероприятиях для поддержания статуса');
		return recommendations;
	}
	
	const pointsNeeded = getPointsToNextLevel(points);
	
	// Basic recommendations
	recommendations.push(`Участвуйте в ${Math.ceil(pointsNeeded / 50)} мероприятиях (по 50 баллов) для достижения уровня "${nextLevel.nameRu}"`);
	
	// Activity-based recommendations
	if (eventsAttended < 5) {
		recommendations.push('Посетите хотя бы 5 мероприятий для получения базового опыта');
	}
	
	if (currentLevel.name === 'Newcomer') {
		recommendations.push('Заполните полностью свой профиль');
		recommendations.push('Добавьте проекты в портфолио');
		recommendations.push('Участвуйте в мероприятиях разных категорий');
	}
	
	if (currentLevel.name === 'Active Member') {
		recommendations.push('Станьте ментором для новичков');
		recommendations.push('Выступите на мероприятии с докладом');
		recommendations.push('Организуйте свое первое мероприятие');
	}
	
	if (currentLevel.name === 'Expert') {
		recommendations.push('Организуйте серию мероприятий');
		recommendations.push('Получите высокие оценки от участников');
		recommendations.push('Участвуйте в управлении парламентом');
	}
	
	if (currentLevel.name === 'Leader') {
		recommendations.push('Реализуйте крупный проект');
		recommendations.push('Наставляйте других лидеров');
		recommendations.push('Участвуйте в международных программах');
	}
	
	return recommendations;
};
