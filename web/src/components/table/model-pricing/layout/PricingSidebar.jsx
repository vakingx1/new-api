/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Button, Input, Select } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import PricingGroups from '../filter/PricingGroups';
import PricingQuotaTypes from '../filter/PricingQuotaTypes';
import PricingEndpointTypes from '../filter/PricingEndpointTypes';
import PricingVendors from '../filter/PricingVendors';
import PricingTags from '../filter/PricingTags';

import { resetPricingFilters } from '../../../../helpers/utils';
import { usePricingFilterCounts } from '../../../../hooks/model-pricing/usePricingFilterCounts';

const PricingSidebar = ({
  showWithRecharge,
  setShowWithRecharge,
  currency,
  setCurrency,
  handleChange,
  setActiveKey,
  showRatio,
  setShowRatio,
  viewMode,
  setViewMode,
  filterGroup,
  setFilterGroup,
  handleGroupClick,
  filterQuotaType,
  setFilterQuotaType,
  filterEndpointType,
  setFilterEndpointType,
  filterVendor,
  setFilterVendor,
  filterTag,
  setFilterTag,
  currentPage,
  setCurrentPage,
  tokenUnit,
  setTokenUnit,
  loading,
  t,
  ...categoryProps
}) => {
  const {
    quotaTypeModels,
    endpointTypeModels,
    vendorModels,
    tagModels,
    groupCountModels,
  } = usePricingFilterCounts({
    models: categoryProps.models,
    filterGroup,
    filterQuotaType,
    filterEndpointType,
    filterVendor,
    filterTag,
    searchValue: categoryProps.searchValue,
  });

  const handleResetFilters = () =>
    resetPricingFilters({
      handleChange,
      setShowWithRecharge,
      setCurrency,
      setShowRatio,
      setViewMode,
      setFilterGroup,
      setFilterQuotaType,
      setFilterEndpointType,
      setFilterVendor,
      setFilterTag,
      setCurrentPage,
      setTokenUnit,
    });

  return (
    <div className='p-2'>
      {/* 搜索框 */}
      <div className='mb-4'>
        <Input
          prefix={<IconSearch />}
          placeholder={t('搜索模型...')}
          value={categoryProps.searchValue || ''}
          onChange={handleChange}
          showClear
        />
      </div>

      {/* 排序 */}
      <div className='mb-4'>
        <div
          className='text-xs font-medium mb-1.5'
          style={{ color: 'var(--semi-color-text-2)' }}
        >
          {t('排序')}
        </div>
        <Select
          value={categoryProps.sortMode || 'recommend'}
          onChange={categoryProps.setSortMode}
          style={{ width: '100%' }}
          optionList={[
            { value: 'recommend', label: t('推荐排序') },
            { value: 'name', label: t('名称排序') },
            { value: 'price_asc', label: t('价格从低到高') },
            { value: 'price_desc', label: t('价格从高到低') },
          ]}
        />
      </div>

      {/* 筛选标题 + 重置 */}
      <div className='flex items-center justify-between mb-4'>
        <div
          className='text-sm font-semibold'
          style={{ color: 'var(--semi-color-text-1)' }}
        >
          {t('筛选')}
        </div>
        <Button
          theme='borderless'
          type='tertiary'
          size='small'
          onClick={handleResetFilters}
        >
          {t('重置')}
        </Button>
      </div>

      <PricingVendors
        filterVendor={filterVendor}
        setFilterVendor={setFilterVendor}
        models={vendorModels}
        allModels={categoryProps.models}
        loading={loading}
        t={t}
      />

      <PricingTags
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        models={tagModels}
        allModels={categoryProps.models}
        loading={loading}
        t={t}
      />

      <PricingGroups
        filterGroup={filterGroup}
        setFilterGroup={handleGroupClick}
        usableGroup={categoryProps.usableGroup}
        groupRatio={categoryProps.groupRatio}
        models={groupCountModels}
        loading={loading}
        t={t}
      />

      <PricingQuotaTypes
        filterQuotaType={filterQuotaType}
        setFilterQuotaType={setFilterQuotaType}
        models={quotaTypeModels}
        loading={loading}
        t={t}
      />

      <PricingEndpointTypes
        filterEndpointType={filterEndpointType}
        setFilterEndpointType={setFilterEndpointType}
        models={endpointTypeModels}
        allModels={categoryProps.models}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default PricingSidebar;
