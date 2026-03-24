"use client";
import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";

interface CityAutocompleteProps {
	value: string;
	onChange: (value: string) => void;
}

export default function CityAutocomplete({ value, onChange }: CityAutocompleteProps) {
	const currentLocale = useLocale();
	const [isOpen, setIsOpen] = useState(false);
	const [filteredCities, setFilteredCities] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Popular cities list
	const cities = currentLocale === "ru" ? [
		"Москва",
		"Санкт-Петербург",
		"Новосибирск",
		"Екатеринбург",
		"Казань",
		"Нижний Новгород",
		"Челябинск",
		"Самара",
		"Омск",
		"Ростов-на-Дону",
		"Уфа",
		"Красноярск",
		"Воронеж",
		"Пермь",
		"Волгоград",
		"Краснодар",
		"Саратов",
		"Тюмень",
		"Тольятти",
		"Ижевск",
		"Барнаул",
		"Ульяновск",
		"Иркутск",
		"Хабаровск",
		"Ярославль",
		"Владивосток",
		"Махачкала",
		"Томск",
		"Оренбург",
		"Кемерово",
	] : [
		"New York",
		"Los Angeles",
		"Chicago",
		"Houston",
		"Phoenix",
		"Philadelphia",
		"San Antonio",
		"San Diego",
		"Dallas",
		"San Jose",
		"Austin",
		"Jacksonville",
		"Fort Worth",
		"Columbus",
		"Charlotte",
		"San Francisco",
		"Indianapolis",
		"Seattle",
		"Denver",
		"Washington",
		"Boston",
		"Nashville",
		"Detroit",
		"Portland",
		"Las Vegas",
		"Miami",
		"Atlanta",
		"Minneapolis",
		"Toronto",
		"Vancouver",
	];

	useEffect(() => {
		if (value) {
			const filtered = cities.filter(city =>
				city.toLowerCase().includes(value.toLowerCase())
			);
			setFilteredCities(filtered);
			setIsOpen(filtered.length > 0);
		} else {
			setFilteredCities(cities.slice(0, 10)); // Show top 10 cities when empty
			setIsOpen(false);
		}
	}, [value]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
		setIsOpen(true);
	};

	const handleCitySelect = (city: string) => {
		onChange(city);
		setIsOpen(false);
		inputRef.current?.blur();
	};

	const handleFocus = () => {
		if (filteredCities.length > 0) {
			setIsOpen(true);
		}
	};

	return (
		<div className="relative">
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={handleInputChange}
				onFocus={handleFocus}
				className="w-full px-4 py-3 rounded-lg border border-[#260A2F]/20 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
				placeholder={currentLocale === "ru" ? "Начните вводить город..." : "Start typing city..."}
				autoComplete="off"
			/>

			{isOpen && filteredCities.length > 0 && (
				<div
					ref={dropdownRef}
					className="absolute z-50 w-full mt-2 bg-white border-2 border-[#260A2F]/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
					{filteredCities.map((city, index) => (
						<button
							key={index}
							type="button"
							onClick={() => handleCitySelect(city)}
							className="w-full px-4 py-3 text-left hover:bg-[#4A7C59]/10 transition-colors border-b border-[#260A2F]/5 last:border-b-0">
							<span className="text-[#260A2F] font-medium">{city}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
