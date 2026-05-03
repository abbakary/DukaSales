import { useAuthStore } from '@/lib/stores/auth-store';
import type { BusinessFeatures, UnitType } from '@/lib/types';

const businessFeatureMap: Record<string, BusinessFeatures> = {
  retail: {
    supportsWeightUnit: false,
    supportsLengthUnit: false,
    supportsVolumeUnit: false,
    hasExpiryTracking: false,
    hasBatchTracking: false,
    allowsCustomPricing: false,
    hasBulkPricing: false,
    hasLogistics: false,
    hasPrepaidOrders: false,
    hasPrescriptionTracking: false,
    availableUnits: ['piece', 'box', 'pack', 'dozen'],
  },
  pharmacy: {
    supportsWeightUnit: false,
    supportsLengthUnit: false,
    supportsVolumeUnit: true,
    hasExpiryTracking: true,
    hasBatchTracking: true,
    allowsCustomPricing: false,
    hasBulkPricing: false,
    hasLogistics: false,
    hasPrepaidOrders: false,
    hasPrescriptionTracking: true,
    availableUnits: ['piece', 'box', 'pack', 'ml', 'liter'],
  },
  building: {
    supportsWeightUnit: true,
    supportsLengthUnit: true,
    supportsVolumeUnit: true,
    hasExpiryTracking: false,
    hasBatchTracking: false,
    allowsCustomPricing: true,
    hasBulkPricing: true,
    hasLogistics: true,
    hasPrepaidOrders: true,
    hasPrescriptionTracking: false,
    availableUnits: ['piece', 'kg', 'g', 'meter', 'cm', 'liter', 'box'],
  },
  wholesale: {
    supportsWeightUnit: true,
    supportsLengthUnit: false,
    supportsVolumeUnit: true,
    hasExpiryTracking: false,
    hasBatchTracking: true,
    allowsCustomPricing: true,
    hasBulkPricing: true,
    hasLogistics: true,
    hasPrepaidOrders: true,
    hasPrescriptionTracking: false,
    availableUnits: ['piece', 'kg', 'liter', 'box', 'pack', 'dozen'],
  },
};

// Extend with legacy aliases used in components
export function useBusinessFeatures(): BusinessFeatures & { businessTypes: BusinessType[]; expiryTracking: boolean; batchTracking: boolean; creditSales: boolean; itemDiscounts: boolean; weightUnits: boolean; lengthUnits: boolean; } {
  const company = useAuthStore((state) => state.company);
  const businessTypes = company?.types ?? ['retail'];
  
  // Aggregate features from all active business types
  const aggregatedFeatures: BusinessFeatures = businessTypes.reduce((acc, type) => {
    const features = businessFeatureMap[type] ?? businessFeatureMap.retail;
    return {
      supportsWeightUnit: acc.supportsWeightUnit || features.supportsWeightUnit,
      supportsLengthUnit: acc.supportsLengthUnit || features.supportsLengthUnit,
      supportsVolumeUnit: acc.supportsVolumeUnit || features.supportsVolumeUnit,
      hasExpiryTracking: acc.hasExpiryTracking || features.hasExpiryTracking,
      hasBatchTracking: acc.hasBatchTracking || features.hasBatchTracking,
      allowsCustomPricing: acc.allowsCustomPricing || features.allowsCustomPricing,
      hasBulkPricing: acc.hasBulkPricing || features.hasBulkPricing,
      hasLogistics: acc.hasLogistics || features.hasLogistics,
      hasPrepaidOrders: acc.hasPrepaidOrders || features.hasPrepaidOrders,
      hasPrescriptionTracking: acc.hasPrescriptionTracking || features.hasPrescriptionTracking,
      availableUnits: Array.from(new Set([...acc.availableUnits, ...features.availableUnits])),
    };
  }, { ...businessFeatureMap.retail, availableUnits: [] } as BusinessFeatures);
  
  return {
    ...aggregatedFeatures,
    businessTypes,
    // Legacy aliases for component compatibility
    expiryTracking: aggregatedFeatures.hasExpiryTracking,
    batchTracking: aggregatedFeatures.hasBatchTracking,
    creditSales: true, // always allow credit sales
    itemDiscounts: true, // always allow item discounts
    weightUnits: aggregatedFeatures.supportsWeightUnit,
    lengthUnits: aggregatedFeatures.supportsLengthUnit,
  };
}

export function getUnitLabel(unit: UnitType): string {
  const labels: Record<UnitType, string> = {
    piece: 'pcs',
    kg: 'kg',
    g: 'g',
    meter: 'm',
    cm: 'cm',
    liter: 'L',
    ml: 'ml',
    box: 'box',
    pack: 'pack',
    dozen: 'dz',
  };
  return labels[unit] || unit;
}

export function getUnitFullName(unit: UnitType): string {
  const names: Record<UnitType, string> = {
    piece: 'Pieces',
    kg: 'Kilograms',
    g: 'Grams',
    meter: 'Meters',
    cm: 'Centimeters',
    liter: 'Liters',
    ml: 'Milliliters',
    box: 'Boxes',
    pack: 'Packs',
    dozen: 'Dozens',
  };
  return names[unit] || unit;
}
