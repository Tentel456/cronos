// PDF Export utility for Observer Dashboard
// Install: npm install jspdf jspdf-autotable

interface CandidateData {
	name: string;
	city: string;
	age: number;
	rating: number;
	eventsAttended: number;
	mainCategory: string;
	interests: string[];
	motivation: string;
}

export const exportCandidateToPDF = async (candidate: CandidateData) => {
	try {
		// Dynamic import to avoid SSR issues
		const jsPDF = (await import('jspdf')).default;
		const autoTable = (await import('jspdf-autotable')).default;

		const doc = new jsPDF();
		
		// Add Russian font support (optional - requires font file)
		// For now using default font
		
		let yPosition = 20;
		
		// Header with gradient background
		doc.setFillColor(147, 51, 234); // Purple
		doc.rect(0, 0, 210, 40, 'F');
		
		// Title
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(24);
		doc.text('ПРОФИЛЬ КАНДИДАТА', 105, 20, { align: 'center' });
		
		doc.setFontSize(12);
		doc.text('Кадровый резерв молодежного парламента', 105, 30, { align: 'center' });
		
		// Reset text color
		doc.setTextColor(0, 0, 0);
		yPosition = 50;
		
		// Personal Information Section
		doc.setFontSize(16);
		doc.setFont(undefined, 'bold');
		doc.text('Личная информация', 20, yPosition);
		yPosition += 10;
		
		doc.setFontSize(11);
		doc.setFont(undefined, 'normal');
		
		const personalInfo = [
			['Имя:', candidate.name],
			['Город:', candidate.city],
			['Возраст:', `${candidate.age} лет`],
			['Основное направление:', candidate.mainCategory]
		];
		
		autoTable(doc, {
			startY: yPosition,
			head: [],
			body: personalInfo,
			theme: 'plain',
			styles: { fontSize: 11, cellPadding: 3 },
			columnStyles: {
				0: { fontStyle: 'bold', cellWidth: 60 },
				1: { cellWidth: 120 }
			}
		});
		
		yPosition = (doc as any).lastAutoTable.finalY + 15;
		
		// Statistics Section
		doc.setFontSize(16);
		doc.setFont(undefined, 'bold');
		doc.text('Статистика активности', 20, yPosition);
		yPosition += 10;
		
		doc.setFontSize(11);
		doc.setFont(undefined, 'normal');
		
		const stats = [
			['Рейтинг:', `${candidate.rating} баллов`],
			['Посещено событий:', `${candidate.eventsAttended}`],
			['Статус:', candidate.rating >= 1001 ? 'Чемпион' : candidate.rating >= 601 ? 'Лидер' : candidate.rating >= 301 ? 'Эксперт' : candidate.rating >= 101 ? 'Активный участник' : 'Новичок']
		];
		
		autoTable(doc, {
			startY: yPosition,
			head: [],
			body: stats,
			theme: 'plain',
			styles: { fontSize: 11, cellPadding: 3 },
			columnStyles: {
				0: { fontStyle: 'bold', cellWidth: 60 },
				1: { cellWidth: 120 }
			}
		});
		
		yPosition = (doc as any).lastAutoTable.finalY + 15;
		
		// Interests Section
		if (candidate.interests.length > 0) {
			doc.setFontSize(16);
			doc.setFont(undefined, 'bold');
			doc.text('Интересы', 20, yPosition);
			yPosition += 10;
			
			doc.setFontSize(11);
			doc.setFont(undefined, 'normal');
			
			candidate.interests.forEach((interest) => {
				doc.text(`• ${interest}`, 25, yPosition);
				yPosition += 7;
			});
			
			yPosition += 10;
		}
		
		// Motivation Section
		if (candidate.motivation) {
			// Check if we need a new page
			if (yPosition > 250) {
				doc.addPage();
				yPosition = 20;
			}
			
			doc.setFontSize(16);
			doc.setFont(undefined, 'bold');
			doc.text('Мотивация', 20, yPosition);
			yPosition += 10;
			
			doc.setFontSize(11);
			doc.setFont(undefined, 'normal');
			
			const splitMotivation = doc.splitTextToSize(candidate.motivation, 170);
			doc.text(splitMotivation, 20, yPosition);
			yPosition += splitMotivation.length * 7 + 10;
		}
		
		// Recommendations Section
		if (yPosition > 240) {
			doc.addPage();
			yPosition = 20;
		}
		
		doc.setFontSize(16);
		doc.setFont(undefined, 'bold');
		doc.text('Рекомендации', 20, yPosition);
		yPosition += 10;
		
		doc.setFontSize(11);
		doc.setFont(undefined, 'normal');
		
		const recommendations = [
			`Кандидат показывает ${candidate.rating >= 600 ? 'высокую' : candidate.rating >= 300 ? 'хорошую' : 'базовую'} активность`,
			`Посетил ${candidate.eventsAttended} мероприятий`,
			candidate.rating >= 1001 ? 'Рекомендуется для руководящих должностей' : 
			candidate.rating >= 601 ? 'Готов к ответственным задачам' :
			candidate.rating >= 301 ? 'Может быть наставником' :
			'Требуется дополнительный опыт'
		];
		
		recommendations.forEach((rec) => {
			const splitRec = doc.splitTextToSize(`• ${rec}`, 170);
			doc.text(splitRec, 20, yPosition);
			yPosition += splitRec.length * 7;
		});
		
		// Footer
		doc.setFontSize(9);
		doc.setTextColor(128, 128, 128);
		doc.text(`Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`, 105, 285, { align: 'center' });
		
		// Save PDF
		const fileName = `candidate_${candidate.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
		doc.save(fileName);
		
		return true;
	} catch (error) {
		console.error('Error generating PDF:', error);
		alert('Ошибка при создании PDF. Убедитесь что установлены библиотеки:\nnpm install jspdf jspdf-autotable');
		return false;
	}
};
