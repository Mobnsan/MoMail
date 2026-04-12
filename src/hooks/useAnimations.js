import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePageAnimation() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.from(pageRef.current, {
        duration: 0.5,
         
        y: 20,
        ease: 'power2.out'
      });
    }
  }, []);

  return pageRef;
}

export function useCardAnimation() {
  const cardsRef = useRef([]);

  useEffect(() => {
    gsap.from(cardsRef.current, {
      duration: 0.6,
       
      y: 30,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }, []);

  const addCardRef = (el) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  return addCardRef;
}

export function useElementHoverAnimation() {
  return {
    onMouseEnter: (e) => {
      gsap.to(e.currentTarget, {
        duration: 0.3,
        scale: 1.05,
        ease: 'power2.out'
      });
    },
    onMouseLeave: (e) => {
      gsap.to(e.currentTarget, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out'
      });
    }
  };
}
