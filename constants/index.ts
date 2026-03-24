import {
	eshuis,
	haafkes,
	hartman,
	pentuin,
	saion,
	stewards,
} from "@/public";

export const links = [
	{
		id: 1,
		title: "Our Team",
		href: "our-ambition",
		isPage: false,
	},
	{
		id: 2,
		title: "What we do",
		href: "what-we-do",
		isPage: false,
	},
	{
		id: 3,
		title: "Transformation",
		href: "transformation",
		isPage: false,
	},
	{
		id: 4,
		title: "Our impact",
		href: "our-impact",
		isPage: false,
	},
	{
		id: 5,
		title: "Get in touch",
		href: "get-in-touch",
		isPage: false,
	},
	{
		id: 6,
		title: "Login",
		href: "login",
		isPage: true,
	},
	{
		id: 7,
		title: "Register",
		href: "register",
		isPage: true,
	},
] as const;

export const collaborationItems = [
	{
		id: 1,
		src: saion,
	},
	{
		id: 2,
		src: haafkes,
	},
	{
		id: 3,
		src: pentuin,
	},
	{
		id: 4,
		src: eshuis,
	},
	{
		id: 5,
		src: hartman,
	},
	{
		id: 6,
		src: stewards,
	},
];
