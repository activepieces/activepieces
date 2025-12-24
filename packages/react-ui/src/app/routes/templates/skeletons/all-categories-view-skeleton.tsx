import { CategorySectionSkeleton } from './category-section-skeleton';

export const AllCategoriesViewSkeleton = () => {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, index) => (
        <CategorySectionSkeleton key={index} />
      ))}
    </div>
  );
};
