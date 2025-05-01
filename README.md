
# Together - Search and Navigate

A Next.js application with Tailwind CSS that allows users to search for places, view them in a card layout with infinite scrolling, and navigate to selected places.

## Features

- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Search Functionality**: Search for places and view results
- **Card Layout**: View search results in a card format
- **Infinite Scrolling**: Load more results as you scroll
- **Route Guidance**: Select places and view route guidance
- **Sharing**: Share routes with others

## Technologies Used

- Next.js 15
- React 19
- Tailwind CSS 4
- TypeScript
- next-themes for dark mode
- react-intersection-observer for infinite scrolling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app`: Next.js App Router pages
- `/components`: Reusable React components
- `/lib`: Utility functions and data services
- `/public`: Static assets

## Components

- **Search**: Search input component
- **Card**: Card component for displaying places
- **InfiniteScroll**: Component for implementing infinite scrolling
- **ThemeToggle**: Button for toggling between light and dark modes
- **ThemeProvider**: Provider for theme context

## Pages

- **Home**: Main page with search and results
- **Route/[id]**: Route guidance page for a selected place

## Mock Data

The application uses mock data for demonstration purposes. In a real-world scenario, this would be replaced with API calls to a backend service.
# together-front
