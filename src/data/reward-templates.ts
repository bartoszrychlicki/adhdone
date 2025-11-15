export type RewardTemplate = {
  id: string
  name: string
  description: string
  costPoints: number
  category: "aktywnosc" | "media" | "rodzina"
  imageUrl: string
}

export const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    id: "movie-night",
    name: "Wieczór filmowy",
    description: "Wybierz film i zajmij miejsce VIP na kanapie.",
    costPoints: 60,
    category: "rodzina",
    imageUrl: "/images/rewards/movie-night.png",
  },
  {
    id: "game-session",
    name: "Dodatkowe 30 minut gry",
    description: "Zagraj w ulubioną grę video lub planszową.",
    costPoints: 45,
    category: "media",
    imageUrl: "/images/rewards/game-session.png",
  },
  {
    id: "dessert-choice",
    name: "Wybór deseru",
    description: "Zdecyduj co zjemy na słodko w weekend.",
    costPoints: 35,
    category: "rodzina",
    imageUrl: "/images/rewards/dessert-choice.png",
  },
  {
    id: "park-trip",
    name: "Wypad do parku",
    description: "Wybierz miejsce na wspólny spacer lub wycieczkę.",
    costPoints: 80,
    category: "aktywnosc",
    imageUrl: "/images/rewards/park-trip.png",
  },
  {
    id: "lego-hour",
    name: "Godzina klocków",
    description: "Zbudujmy razem coś niezwykłego.",
    costPoints: 40,
    category: "aktywnosc",
    imageUrl: "/images/rewards/lego-hour.png",
  },
]
