import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { ComparableProperty } from "@/types/valuation";

export function ComparablePropertyCard({ property }: { property: ComparableProperty }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-up-text-primary">{property.town}</p>
      <p className="text-xs text-up-text-secondary">{property.neighborhood}</p>
      <p className="mt-1 font-data text-lg font-semibold text-up-accent">
        {formatCurrency(property.salePrice)}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-up-text-secondary">
        <li>{property.propertyType}</li>
        <li>{property.bedrooms} bed · {property.bathrooms} bath</li>
      </ul>
    </Card>
  );
}
