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
import { ImagePreview } from '@douyinfe/semi-ui';
import { Zap } from 'lucide-react';
import PricingSidebar from './PricingSidebar';
import PricingContent from './content/PricingContent';
import ModelDetailSideSheet from '../modal/ModelDetailSideSheet';
import { useModelPricingData } from '../../../../hooks/model-pricing/useModelPricingData';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

const PricingPage = () => {
  const pricingData = useModelPricingData();
  const isMobile = useIsMobile();
  const [showRatio, setShowRatio] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('card');
  const allProps = {
    ...pricingData,
    showRatio,
    setShowRatio,
    viewMode,
    setViewMode,
  };

  return (
    <div className='pricing-layout'>
      {/* 页面标题区域 */}
      <div className='pricing-page-header'>
        <div className='flex items-center justify-between'>
          <h1 className='pricing-page-title'>{pricingData.t('模型广场')}</h1>
          {/* 可用模型数量标签 */}
          {!pricingData.loading && pricingData.models?.length > 0 && (
            <span className='pricing-model-count'>
              <Zap size={14} />
              {pricingData.models.length} {pricingData.t('个可用模型')}
            </span>
          )}
        </div>
        <p className='pricing-page-subtitle'>
          {pricingData.t('浏览和选择适合你业务场景的 AI 模型，按需调用')}
        </p>
      </div>

      {/* 主体内容：侧边栏 + 卡片区域 */}
      <div className='pricing-body'>
        {/* 侧边栏（桌面端内嵌在页面中） */}
        {!isMobile && (
          <aside className='pricing-sidebar pricing-scroll-hide'>
            <PricingSidebar {...allProps} />
          </aside>
        )}

        {/* 内容区域 */}
        <div className='pricing-content pricing-scroll-hide'>
          <PricingContent
            {...allProps}
            isMobile={isMobile}
            sidebarProps={allProps}
          />
        </div>
      </div>

      <ImagePreview
        src={pricingData.modalImageUrl}
        visible={pricingData.isModalOpenurl}
        onVisibleChange={(visible) => pricingData.setIsModalOpenurl(visible)}
      />

      <ModelDetailSideSheet
        visible={pricingData.showModelDetail}
        onClose={pricingData.closeModelDetail}
        modelData={pricingData.selectedModel}
        groupRatio={pricingData.groupRatio}
        usableGroup={pricingData.usableGroup}
        currency={pricingData.currency}
        tokenUnit={pricingData.tokenUnit}
        displayPrice={pricingData.displayPrice}
        showRatio={allProps.showRatio}
        vendorsMap={pricingData.vendorsMap}
        endpointMap={pricingData.endpointMap}
        autoGroups={pricingData.autoGroups}
        t={pricingData.t}
      />
    </div>
  );
};

export default PricingPage;
