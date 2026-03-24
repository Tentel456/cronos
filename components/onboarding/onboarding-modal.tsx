"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleSelection from "./role-selection";
import ParticipantOnboarding from "./participant-onboarding";
import OrganizerOnboarding from "./organizer-onboarding";
import ObserverOnboarding from "./observer-onboarding";

interface OnboardingModalProps {
	isOpen: boolean;
	onComplete: (data: any) => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
	const [selectedRole, setSelectedRole] = useState<"participant" | "organizer" | "observer" | null>(null);

	const handleRoleSelect = (role: "participant" | "organizer" | "observer") => {
		setSelectedRole(role);
	};

	const handleOnboardingComplete = (data: any) => {
		onComplete({
			role: selectedRole,
			...data,
		});
	};

	const handleBack = () => {
		setSelectedRole(null);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
						style={{ isolation: 'isolate' }}
					/>
					
					{/* Modal */}
					<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.95, opacity: 0, y: 20 }}
							transition={{ type: "spring", duration: 0.5 }}
							className="bg-gradient-to-br from-[#D4CFC9] to-[#E5E0DA] rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-8 relative">
							
							{/* Back button - only show when role is selected */}
							{selectedRole && (
								<button
									onClick={handleBack}
									className="absolute top-6 left-6 p-3 rounded-full bg-white/80 hover:bg-white border-2 border-[#260A2F]/10 hover:border-[#4A7C59] transition-all duration-300 group shadow-lg hover:shadow-xl">
									<svg 
										width="24" 
										height="24" 
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										strokeWidth="2" 
										strokeLinecap="round" 
										strokeLinejoin="round"
										className="text-[#260A2F] group-hover:text-[#4A7C59] transition-colors">
										<path d="M19 12H5M12 19l-7-7 7-7"/>
									</svg>
								</button>
							)}
							
							{/* Decorative elements */}
							<div className="absolute top-0 right-0 w-64 h-64 bg-[#4A7C59]/10 rounded-full blur-3xl -z-10" />
							<div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD7EF]/20 rounded-full blur-3xl -z-10" />
							
							{!selectedRole ? (
								<RoleSelection onSelectRole={handleRoleSelect} />
							) : selectedRole === "participant" ? (
								<ParticipantOnboarding onComplete={handleOnboardingComplete} />
							) : selectedRole === "organizer" ? (
								<OrganizerOnboarding onComplete={handleOnboardingComplete} />
							) : (
								<ObserverOnboarding onComplete={handleOnboardingComplete} />
							)}
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
}
