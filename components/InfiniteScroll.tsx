'use client';

import { ReactNode, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteScrollProps {
  children: ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function InfiniteScroll({ children, loadMore, hasMore, loading }: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  return (
      <>
        {children}

        {/* Loading indicator and sentinel element */}
        <div ref={ref} className="h-10 w-full flex items-center justify-center my-4">
          {loading && (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          )}
        </div>

        {/* End of results message */}
        {!hasMore && !loading && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No more results
            </div>
        )}
      </>
  );
}