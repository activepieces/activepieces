import { CategorySectionSkeleton } from './category-section-skeleton';

type AllCategoriesViewSkeletonProps = {
  hideTitle?: boolean;
};

export const AllCategoriesViewSkeleton = ({
  hideTitle = false,
}: AllCategoriesViewSkeletonProps) => {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, index) => (
        <CategorySectionSkeleton key={index} hideTitle={hideTitle} />
      ))}
    </div>
  );
};
