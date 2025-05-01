export interface Place {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string; // 블로그 링크 추가
  bloggerName?: string; // 블로거 이름 추가
}

// Generate 50 mock places
const generateMockPlaces = (): Place[] => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `place-${i + 1}`,
    title: `Place ${i + 1}`,
    description: `This is a description for Place ${i + 1}. It's a great location to visit.`,
    image: i % 3 === 0 ? `https://picsum.photos/seed/${i + 1}/300/200` : undefined,
  }));
};

const mockPlaces = generateMockPlaces();

// Simulate API call with pagination and search
export async function searchPlaces(query: string, page: number, limit: number): Promise<{
  places: Place[];
  hasMore: boolean;
  total: number;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filter places based on search query
  const filteredPlaces = query
    ? mockPlaces.filter(place => 
        place.title.toLowerCase().includes(query.toLowerCase()) || 
        place.description.toLowerCase().includes(query.toLowerCase())
      )
    : mockPlaces;

  // Calculate pagination
  const start = page * limit;
  const end = start + limit;
  const paginatedPlaces = filteredPlaces.slice(start, end);
  
  return {
    places: paginatedPlaces,
    hasMore: end < filteredPlaces.length,
    total: filteredPlaces.length,
  };
}

// Get a single place by ID
export async function getPlaceById(id: string): Promise<Place | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const place = mockPlaces.find(place => place.id === id);
  return place || null;
}