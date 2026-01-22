import { useEffect, useRef } from 'react';

/**
 * useInfiniteScroll Hook
 */
export const useInfiniteScroll = (callback, hasMore, isLoading) => {
  const observerRef = useRef(null);
  const callbackRef = useRef(callback);

  // Always keep the latest callback in a ref to avoid re-creating the observer
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // If we're loading or there's no more data, don't even create an observer
    if (!hasMore || isLoading) return;

    const options = {
      root: null,
      rootMargin: '400px', // Increased margin for smoother preemptive loading
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        callbackRef.current();
      }
    }, options);
 
    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading]); // Re-create observer only when status changes

  return { observerRef };
};
