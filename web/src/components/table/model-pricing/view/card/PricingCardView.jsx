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
import {
  Tag,
  Tooltip,
  Empty,
  Pagination,
  Button,
  Avatar,
} from '@douyinfe/semi-ui';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import {
  Copy,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Zap,
  MessageSquare,
  Image,
  Music,
  Video,
  Code,
  Globe,
} from 'lucide-react';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import {
  stringToColor,
  calculateModelPrice,
  getLobeHubIcon,
} from '../../../../../helpers';
import PricingCardSkeleton from './PricingCardSkeleton';
import { useMinimumLoadingTime } from '../../../../../hooks/common/useMinimumLoadingTime';
import { useIsMobile } from '../../../../../hooks/common/useIsMobile';

/* 图标容器样式常量 */
const ICON_STYLES = {
  container:
    'w-12 h-12 rounded-2xl flex items-center justify-center relative shadow-md flex-shrink-0',
  icon: 'w-8 h-8 flex items-center justify-center',
};

/* 端点类型 → 图标和中文标签的映射 */
const ENDPOINT_META = {
  chat: { icon: MessageSquare, label: '对话' },
  completions: { icon: Code, label: '补全' },
  embeddings: { icon: Globe, label: '向量' },
  images: { icon: Image, label: '图像' },
  audio: { icon: Music, label: '语音' },
  video: { icon: Video, label: '视频' },
  moderation: { icon: Zap, label: '审核' },
  rerank: { icon: Zap, label: '重排序' },
  realtime: { icon: Zap, label: '实时' },
};

const PricingCardView = ({
  filteredModels,
  loading,
  rowSelection,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  selectedGroup,
  groupRatio,
  copyText,
  setModalImageUrl,
  setIsModalOpenurl,
  currency,
  tokenUnit,
  displayPrice,
  showRatio,
  t,
  selectedRowKeys = [],
  setSelectedRowKeys,
  openModelDetail,
}) => {
  const showSkeleton = useMinimumLoadingTime(loading);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(
    startIndex,
    startIndex + pageSize
  );
  const getModelKey = (model) => model.key ?? model.model_name ?? model.id;
  const isMobile = useIsMobile();

  /* ---- 获取模型图标 ---- */
  const getModelIcon = (model) => {
    if (!model || !model.model_name) {
      return (
        <div className={ICON_STYLES.container}>
          <Avatar size='large'>?</Avatar>
        </div>
      );
    }
    if (model.icon) {
      return (
        <div className={ICON_STYLES.container}>
          <div className={ICON_STYLES.icon}>
            {getLobeHubIcon(model.icon, 32)}
          </div>
        </div>
      );
    }
    if (model.vendor_icon) {
      return (
        <div className={ICON_STYLES.container}>
          <div className={ICON_STYLES.icon}>
            {getLobeHubIcon(model.vendor_icon, 32)}
          </div>
        </div>
      );
    }
    /* 回退：用模型名前两个字符生成头像 */
    const avatarText = model.model_name.slice(0, 2).toUpperCase();
    return (
      <div className={ICON_STYLES.container}>
        <Avatar
          size='large'
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          {avatarText}
        </Avatar>
      </div>
    );
  };

  /* ---- 标签徽章：HOT / NEW / 自定义 ---- */
  const renderBadges = (record) => {
    const badges = [];
    if (record.tags) {
      const tagArr = record.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      tagArr.forEach((tg, idx) => {
        const upper = tg.toUpperCase();
        if (upper === 'HOT') {
          badges.push(
            <span
              key={`badge-${idx}`}
              className='inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white'
              style={{ backgroundColor: '#e65100' }}
            >
              HOT
            </span>
          );
        } else if (upper === 'NEW') {
          badges.push(
            <span
              key={`badge-${idx}`}
              className='inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white'
              style={{ backgroundColor: '#2e7d32' }}
            >
              NEW
            </span>
          );
        } else {
          badges.push(
            <Tag
              key={`badge-${idx}`}
              shape='circle'
              color={stringToColor(tg)}
              size='small'
            >
              {tg}
            </Tag>
          );
        }
      });
    }
    return badges;
  };

  /* ---- 能力标签（基于端点类型） ---- */
  const renderCapabilities = (record) => {
    const types = record.supported_endpoint_types || [];
    if (types.length === 0) return null;
    return (
      <div className='flex items-center gap-2 flex-wrap'>
        {types.slice(0, 3).map((ep) => {
          const meta = ENDPOINT_META[ep] || { icon: Zap, label: ep };
          const IconComp = meta.icon;
          return (
            <span
              key={ep}
              className='inline-flex items-center gap-1 text-xs pricing-card-capability-tag'
            >
              <IconComp size={12} />
              {t(meta.label)}
            </span>
          );
        })}
      </div>
    );
  };

  /* ---- 骨架屏 ---- */
  if (showSkeleton) {
    return (
      <PricingCardSkeleton
        rowSelection={!!rowSelection}
        showRatio={showRatio}
      />
    );
  }

  /* ---- 空状态 ---- */
  if (!filteredModels || filteredModels.length === 0) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={t('搜索无结果')}
        />
      </div>
    );
  }

  return (
    <div className='px-2 pt-2'>
      <div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4'>
        {paginatedModels.map((model, index) => {
          const modelKey = getModelKey(model);

          /* 计算价格 */
          const priceData = calculateModelPrice({
            record: model,
            selectedGroup,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
          });

          return (
            <div
              key={modelKey || index}
              className='pricing-model-card'
              onClick={() => openModelDetail && openModelDetail(model)}
            >
              <div className='flex flex-col h-full'>
                {/* ===== 头部：Logo + 模型名 + 标签 ===== */}
                <div className='flex items-start gap-3 mb-3'>
                  {getModelIcon(model)}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h3 className='text-lg font-bold truncate pricing-card-title'>
                        {model.model_name}
                      </h3>
                      {renderBadges(model)}
                    </div>
                    {/* 模型 ID，可复制 */}
                    <div className='flex items-center gap-1.5 mt-1'>
                      <span className='text-xs pricing-card-model-id truncate'>
                        {model.model_name}
                      </span>
                      <button
                        className='pricing-card-copy-btn'
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(model.model_name);
                        }}
                        title={t('复制模型名称')}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ===== 模型描述 ===== */}
                {model.description && (
                  <p className='text-sm leading-relaxed line-clamp-2 mb-4 pricing-card-desc'>
                    {model.description}
                  </p>
                )}

                {/* ===== 能力标签 ===== */}
                <div className='mb-4'>{renderCapabilities(model)}</div>

                {/* ===== 价格区域 ===== */}
                <div className='mt-auto'>
                  {priceData.isPerToken ? (
                    <div className='pricing-card-price-row'>
                      <div className='pricing-card-price-block'>
                        <div className='pricing-card-price-label'>
                          {t('输入')}
                        </div>
                        <div className='pricing-card-price-value'>
                          <TrendingDown
                            size={14}
                            className='pricing-card-price-icon-input'
                          />
                          {priceData.inputPrice}/{priceData.unitLabel}
                        </div>
                      </div>
                      <div className='pricing-card-price-block'>
                        <div className='pricing-card-price-label'>
                          {t('输出')}
                        </div>
                        <div className='pricing-card-price-value'>
                          <TrendingUp
                            size={14}
                            className='pricing-card-price-icon-output'
                          />
                          {priceData.completionPrice}/{priceData.unitLabel}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='pricing-card-price-row'>
                      <div
                        className='pricing-card-price-block'
                        style={{ flex: 1 }}
                      >
                        <div className='pricing-card-price-label'>
                          {t('模型价格')}
                        </div>
                        <div className='pricing-card-price-value'>
                          {priceData.price} / {t('次')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 倍率信息（可选） */}
                  {showRatio && (
                    <div className='pt-3 mb-4 pricing-card-ratio-section'>
                      <div className='flex items-center space-x-1 mb-2'>
                        <span className='text-xs font-medium pricing-card-ratio-label'>
                          {t('倍率信息')}
                        </span>
                        <Tooltip
                          content={t('倍率是为了方便换算不同价格的模型')}
                        >
                          <IconHelpCircle
                            className='cursor-pointer'
                            size='small'
                            style={{ color: 'var(--semi-color-primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageUrl('/ratio.png');
                              setIsModalOpenurl(true);
                            }}
                          />
                        </Tooltip>
                      </div>
                      <div className='grid grid-cols-3 gap-2 text-xs pricing-card-ratio-values'>
                        <div>
                          {t('模型')}:{' '}
                          {model.quota_type === 0 ? model.model_ratio : t('无')}
                        </div>
                        <div>
                          {t('补全')}:{' '}
                          {model.quota_type === 0
                            ? parseFloat(model.completion_ratio.toFixed(3))
                            : t('无')}
                        </div>
                        <div>
                          {t('分组')}: {priceData?.usedGroupRatio ?? '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== 使用模型按钮 ===== */}
                  <button
                    className='pricing-card-use-btn'
                    onClick={(e) => {
                      e.stopPropagation();
                      openModelDetail && openModelDetail(model);
                    }}
                  >
                    {t('使用模型')}
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 分页 */}
      {filteredModels.length > 0 && (
        <div className='flex justify-center mt-6 py-4 border-t pricing-pagination-divider'>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={filteredModels.length}
            showSizeChanger={true}
            pageSizeOptions={[10, 20, 50, 100]}
            size={isMobile ? 'small' : 'default'}
            showQuickJumper={isMobile}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PricingCardView;
