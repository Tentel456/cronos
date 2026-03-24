"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface Review {
	id: string;
	rating: number;
	comment: string;
	created_at: string;
	reviewer: {
		first_name: string;
		last_name: string;
		avatar_url: string;
	};
	event: {
		title: string;
	};
}

interface OrganizerReviewsProps {
	organizerId: string;
	currentUserId?: string;
}

export default function OrganizerReviews({ organizerId, currentUserId }: OrganizerReviewsProps) {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [loading, setLoading] = useState(true);
	const [averageRating, setAverageRating] = useState(0);
	const [reviewCount, setReviewCount] = useState(0);
	const [showAddReview, setShowAddReview] = useState(false);
	const [userEvents, setUserEvents] = useState<any[]>([]);
	const [newReview, setNewReview] = useState({
		event_id: '',
		rating: 5,
		comment: ''
	});
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		loadReviews();
		loadStats();
		if (currentUserId) {
			loadUserEvents();
		}
	}, [organizerId, currentUserId]);

	const loadReviews = async () => {
		const { data, error } = await supabase
			.from('organizer_reviews')
			.select(`
				*,
				reviewer:profiles!reviewer_id(first_name, last_name, avatar_url),
				event:events(title)
			`)
			.eq('organizer_id', organizerId)
			.order('created_at', { ascending: false })
			.limit(10);

		if (!error && data) {
			setReviews(data);
		}
		setLoading(false);
	};

	const loadStats = async () => {
		// Get average rating
		const { data: avgData } = await supabase
			.rpc('calculate_organizer_rating', { org_id: organizerId });

		if (avgData !== null) {
			setAverageRating(avgData);
		}

		// Get review count
		const { data: countData } = await supabase
			.rpc('get_organizer_review_count', { org_id: organizerId });

		if (countData !== null) {
			setReviewCount(countData);
		}
	};

	const loadUserEvents = async () => {
		if (!currentUserId) return;

		// Get events where user participated and organizer is the target
		const { data, error } = await supabase
			.from('event_participants')
			.select(`
				event_id,
				events(id, title, organizer_id)
			`)
			.eq('participant_id', currentUserId)
			.eq('status', 'confirmed');

		if (!error && data) {
			// Filter events by this organizer
			const organizerEvents = data.filter((item: any) => 
				item.events?.organizer_id === organizerId
			);

			// Check which events don't have reviews yet
			const { data: existingReviews } = await supabase
				.from('organizer_reviews')
				.select('event_id')
				.eq('reviewer_id', currentUserId)
				.eq('organizer_id', organizerId);

			const reviewedEventIds = new Set(existingReviews?.map(r => r.event_id) || []);
			
			const availableEvents = organizerEvents.filter((item: any) => 
				!reviewedEventIds.has(item.event_id)
			);

			setUserEvents(availableEvents);
		}
	};

	const handleSubmitReview = async () => {
		if (!currentUserId || !newReview.event_id) return;

		setSubmitting(true);

		const { error } = await supabase
			.from('organizer_reviews')
			.insert({
				organizer_id: organizerId,
				reviewer_id: currentUserId,
				event_id: newReview.event_id,
				rating: newReview.rating,
				comment: newReview.comment
			});

		if (!error) {
			setNewReview({ event_id: '', rating: 5, comment: '' });
			setShowAddReview(false);
			loadReviews();
			loadStats();
			loadUserEvents();
		} else {
			alert('Ошибка при добавлении отзыва');
		}

		setSubmitting(false);
	};

	const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
		return (
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						onClick={() => interactive && onChange && onChange(star)}
						disabled={!interactive}
						className={`text-2xl ${
							star <= rating ? 'text-yellow-400' : 'text-gray-600'
						} ${interactive ? 'hover:text-yellow-300 cursor-pointer' : ''}`}
					>
						★
					</button>
				))}
			</div>
		);
	};

	if (loading) {
		return <div className="text-gray-400">Загрузка отзывов...</div>;
	}

	return (
		<div className="space-y-6">
			{/* Rating Summary */}
			<div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-200 mb-2">Рейтинг доверия</div>
						<div className="flex items-center gap-4">
							<div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
							<div>
								{renderStars(Math.round(averageRating))}
								<div className="text-sm text-gray-200 mt-1">
									{reviewCount} {reviewCount === 1 ? 'отзыв' : reviewCount < 5 ? 'отзыва' : 'отзывов'}
								</div>
							</div>
						</div>
					</div>

					{currentUserId && userEvents.length > 0 && (
						<button
							onClick={() => setShowAddReview(!showAddReview)}
							className="px-6 py-3 bg-white text-purple-600 font-semibold hover:bg-gray-100 transition-colors"
						>
							Оставить отзыв
						</button>
					)}
				</div>
			</div>

			{/* Add Review Form */}
			{showAddReview && currentUserId && (
				<div className="bg-[#1a1a1a] border border-gray-600 p-6">
					<h3 className="text-xl font-bold mb-4">Новый отзыв</h3>

					{/* Event Selection */}
					<div className="mb-4">
						<label className="block text-sm text-gray-400 mb-2">Выберите мероприятие</label>
						<select
							value={newReview.event_id}
							onChange={(e) => setNewReview({ ...newReview, event_id: e.target.value })}
							className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
						>
							<option value="">-- Выберите мероприятие --</option>
							{userEvents.map((item: any) => (
								<option key={item.event_id} value={item.event_id}>
									{item.events?.title}
								</option>
							))}
						</select>
					</div>

					{/* Rating */}
					<div className="mb-4">
						<label className="block text-sm text-gray-400 mb-2">Оценка</label>
						{renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
					</div>

					{/* Comment */}
					<div className="mb-4">
						<label className="block text-sm text-gray-400 mb-2">Комментарий (необязательно)</label>
						<textarea
							value={newReview.comment}
							onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
							rows={4}
							className="w-full bg-[#0f0f0f] border border-gray-600 px-4 py-2 text-white"
							placeholder="Поделитесь своим опытом..."
						/>
					</div>

					{/* Buttons */}
					<div className="flex gap-3">
						<button
							onClick={handleSubmitReview}
							disabled={!newReview.event_id || submitting}
							className="px-6 py-2 bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? 'Отправка...' : 'Отправить отзыв'}
						</button>
						<button
							onClick={() => setShowAddReview(false)}
							className="px-6 py-2 border border-gray-600 hover:bg-[#2a2a2a] transition-colors"
						>
							Отмена
						</button>
					</div>
				</div>
			)}

			{/* Reviews List */}
			<div className="space-y-4">
				<h3 className="text-xl font-bold">Отзывы участников</h3>

				{reviews.length === 0 ? (
					<div className="bg-[#1a1a1a] border border-gray-600 p-8 text-center text-gray-400">
						Пока нет отзывов
					</div>
				) : (
					reviews.map((review) => (
						<div key={review.id} className="bg-[#1a1a1a] border border-gray-600 p-6">
							<div className="flex items-start gap-4">
								{/* Avatar */}
								<div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
									{review.reviewer.avatar_url ? (
										<Image
											src={review.reviewer.avatar_url}
											alt={review.reviewer.first_name}
											width={48}
											height={48}
											className="rounded-full"
										/>
									) : (
										<span>{review.reviewer.first_name.charAt(0)}</span>
									)}
								</div>

								<div className="flex-1">
									{/* Header */}
									<div className="flex items-center justify-between mb-2">
										<div>
											<div className="font-semibold">
												{review.reviewer.first_name} {review.reviewer.last_name}
											</div>
											<div className="text-sm text-gray-400">
												{review.event.title}
											</div>
										</div>
										<div className="text-sm text-gray-400">
											{new Date(review.created_at).toLocaleDateString('ru-RU')}
										</div>
									</div>

									{/* Rating */}
									<div className="mb-2">
										{renderStars(review.rating)}
									</div>

									{/* Comment */}
									{review.comment && (
										<p className="text-gray-300">{review.comment}</p>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
