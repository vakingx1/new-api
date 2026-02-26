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

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Layers,
  Zap,
  Shield,
  Code,
  ArrowUpRight,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();

  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;

  // ========== 区域4: 代码 Tab 切换 ==========
  const [activeCodeTab, setActiveCodeTab] = useState('python');
  const [copied, setCopied] = useState(false);

  // 代码示例数据
  const codeSamples = useCallback(
    () => ({
      python: `import BestApi

client = BestApi.Client(api_key="your-key")

response = client.chat.completions.create(
    model="gpt-6",
    messages=[
        {"role": "user", "content": "你好，请介绍一下自己"}
    ]
)

print(response.choices[0].message.content)`,
      curl: `curl ${serverAddress}/v1/chat/completions \\
  -H "Authorization: Bearer your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-4-sonnet",
    "messages": [
      {"role": "user", "content": "用 Python 写一个快速排序"}
    ]
  }'`,
      javascript: `import ModelHub from "modelhub";

const client = new ModelHub({ apiKey: "your-key" });

const response = await client.chat.completions.create({
  model: "gemini-2.5-pro",
  messages: [
    { role: "user", content: "解释一下量子计算的原理" }
  ],
});

console.log(response.choices[0].message.content);`,
    }),
    [serverAddress]
  );

  // 复制代码到剪切板
  const handleCopyCode = useCallback(async () => {
    const ok = await copy(codeSamples()[activeCodeTab]);
    if (ok) {
      setCopied(true);
      showSuccess(t('已复制到剪切板'));
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeCodeTab, codeSamples, t]);

  // 复制 API 地址
  const handleCopyBaseURL = useCallback(async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  }, [serverAddress, t]);

  // ========== 加载首页自定义内容 ==========
  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  // ========== 公告弹窗检查 ==========
  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  // ========== 热门模型数据（十六进制颜色确保浅色/暗色模式均可用）==========
  const hotModels = [
    {
      name: 'GPT-6',
      vendor: 'OpenAI',
      tag: 'HOT',
      tagColor:
        'bg-[#fef2f2] text-[#ef4444] dark:bg-[#450a0a] dark:text-[#ef4444]',
      logo: 'OP',
      logoBg: 'bg-[#059669]',
      desc: t('旗舰多模态模型，支持文本、图像和音频'),
      price: '$150.0',
    },
    {
      name: 'Claude 5 Sonnet',
      vendor: 'Anthropic',
      tag: 'NEW',
      tagColor:
        'bg-[#ecfdf5] text-[#10b981] dark:bg-[#022c22] dark:text-[#10b981]',
      logo: 'AN',
      logoBg: 'bg-[#f97316]',
      desc: t('兼顾智能与速度的高性能模型'),
      price: '$15.00',
    },
    {
      name: 'Gemini 3.2 Pro',
      vendor: 'Google',
      tag: 'HOT',
      tagColor:
        'bg-[#fef2f2] text-[#ef4444] dark:bg-[#450a0a] dark:text-[#ef4444]',
      logo: 'GO',
      logoBg: 'bg-[#0891b2]',
      desc: t('百万上下文窗口的强推理模型'),
      price: '$12.5',
    },
  ];

  // ========== 特性卡片数据 ==========
  const features = [
    {
      icon: Layers,
      title: t('统一 API'),
      desc: t(
        '一个接口访问所有模型。OpenAI、Anthropic、Google、Meta 等厂商的模型全部支持，无需分别对接。'
      ),
    },
    {
      icon: Zap,
      title: t('极速响应'),
      desc: t(
        '全球多节点部署，智能路由优化，确保每次 API 调用都能获得亚百毫秒级延迟体验。'
      ),
    },
    {
      icon: Shield,
      title: t('企业级安全'),
      desc: t(
        '端到端加密传输，SOC 2 合规认证，完善的访问控制和审计日志，满足严格的数据安全要求。'
      ),
    },
    {
      icon: Code,
      title: t('开发者友好'),
      desc: t(
        '完善的 SDK 支持，详尽的 API 文档，丰富的代码示例，让你在几分钟内完成集成。'
      ),
    },
  ];

  // 代码 Tab 配置
  const codeTabs = [
    { key: 'python', label: 'Python' },
    { key: 'curl', label: 'cURL' },
    { key: 'javascript', label: 'JavaScript' },
  ];

  // ========== 渲染 ==========
  return (
    <div className='w-full overflow-x-hidden'>
      {/* 公告弹窗 */}
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden bg-[#f8f9fa] dark:bg-[#000000] text-[#1a1a2e] dark:text-[#ffffff]'>
          {/* ==================== 区域1: Hero 首屏 ==================== */}
          <section className='w-full min-h-[90vh] flex flex-col items-center justify-center px-4 pt-32 pb-20 md:pt-44 md:pb-28'>
            {/* 顶部标语胶囊 */}
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 bg-[#f0f0f0] dark:bg-[#111111] text-[#666] dark:text-[#9ca3af] border border-[#e5e5e5] dark:border-[#262626]'>
              <span className='inline-block w-2 h-2 rounded-full bg-[#10b981]' />
              {t('支持 Gemini 3.2 Pro、Claude 5、GPT-6 等最新模型')}
            </div>

            {/* 超大标题 */}
            <h1 className='text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center leading-tight mb-6 text-[#1a1a2e] dark:text-[#ffffff]'>
              {t('一个接口，调用所有')}
              <br />
              {t('AI 模型')}
            </h1>

            {/* 副标题 */}
            <p className='text-base md:text-lg lg:text-xl text-center max-w-2xl mb-10 text-[#666] dark:text-[#9ca3af]'>
              {t(
                '统一的 API 接口，按需调用来自 OpenAI、Anthropic、Google、Meta 等厂商的顶尖 AI 模型。简单集成，按量付费。'
              )}
            </p>

            {/* 按钮组 */}
            <div className='flex flex-col sm:flex-row items-center gap-4'>
              {/* 浏览模型广场按钮 */}
              <Link to='/pricing'>
                <button className='inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-colors hover:opacity-90 bg-[#1a1a2e] text-[#ffffff] dark:bg-[#ffffff] dark:text-[#000000]'>
                  {t('浏览模型广场')}
                  <ArrowRight size={18} />
                </button>
              </Link>

              {/* API 地址复制按钮 */}
              <button
                onClick={handleCopyBaseURL}
                className='inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-mono transition-colors cursor-pointer bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#666] dark:text-[#9ca3af] hover:bg-[#e5e5e5] dark:hover:bg-[#252525] border border-[#e0e0e0] dark:border-[#262626]'
              >
                <span className='text-[#999] dark:text-[#6b7280]'>&gt;_</span>
                <span>curl {serverAddress}/v1/chat</span>
              </button>
            </div>
          </section>

          {/* ==================== 区域2: 特性卡片 ==================== */}
          <section className='w-full px-4 py-20 md:py-28'>
            <div className='max-w-6xl mx-auto'>
              {/* 区域标题 */}
              <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-[#1a1a2e] dark:text-[#ffffff]'>
                {t('更简单、更快速、更安全地使用 AI')}
              </h2>

              {/* 4列卡片 */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
                {features.map((feat, idx) => {
                  const IconComp = feat.icon;
                  return (
                    <div
                      key={idx}
                      className='p-6 rounded-xl transition-colors bg-[#ffffff] dark:bg-[#111111] border border-[#eaeaea] dark:border-[#262626]'
                    >
                      {/* 图标 */}
                      <div className='w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-[#f5f5f5] dark:bg-[#1a1a1a]'>
                        <IconComp
                          size={20}
                          className='text-[#555] dark:text-[#d1d5db]'
                        />
                      </div>
                      {/* 标题 */}
                      <h3 className='text-lg font-semibold mb-2 text-[#1a1a2e] dark:text-[#ffffff]'>
                        {feat.title}
                      </h3>
                      {/* 描述 */}
                      <p className='text-sm leading-relaxed text-[#666] dark:text-[#9ca3af]'>
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================== 区域3: 热门模型展示 ==================== */}
          <section className='w-full px-4 py-20 md:py-28'>
            <div className='max-w-6xl mx-auto'>
              {/* 标题行: 左侧大标题 + 右侧链接 */}
              <div className='flex items-center justify-between mb-12'>
                <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1a2e] dark:text-[#ffffff]'>
                  {t('来自全球顶尖 AI 厂商')}
                </h2>
                <Link
                  to='/pricing'
                  className='inline-flex items-center gap-1 text-sm font-medium transition-colors text-[#666] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#ffffff]'
                >
                  {t('查看全部模型')}
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* 3列模型卡片 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                {hotModels.map((model, idx) => (
                  <div
                    key={idx}
                    className='p-5 rounded-xl flex flex-col justify-between transition-colors bg-[#ffffff] dark:bg-[#111111] border border-[#eaeaea] dark:border-[#262626] hover:border-[#ccc] dark:hover:border-[#404040]'
                  >
                    {/* 卡片头部 */}
                    <div>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          {/* 供应商Logo缩写 */}
                          <div
                            className={`w-9 h-9 ${model.logoBg} rounded-lg flex items-center justify-center text-[#ffffff] text-xs font-bold`}
                          >
                            {model.logo}
                          </div>
                          {/* 模型名 + 标签 */}
                          <div className='flex items-center gap-2'>
                            <span className='font-semibold text-base text-[#1a1a2e] dark:text-[#ffffff]'>
                              {model.name}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${model.tagColor}`}
                            >
                              {model.tag}
                            </span>
                          </div>
                        </div>
                        {/* 右上角箭头 */}
                        <ArrowUpRight
                          size={16}
                          className='text-[#999] dark:text-[#6b7280]'
                        />
                      </div>
                      {/* 供应商名 */}
                      <p className='text-xs mb-2 text-[#999] dark:text-[#6b7280]'>
                        {model.vendor}
                      </p>
                      {/* 描述 */}
                      <p className='text-sm leading-relaxed mb-4 text-[#666] dark:text-[#9ca3af]'>
                        {model.desc}
                      </p>
                    </div>
                    {/* 底部价格 */}
                    <div className='text-sm font-medium text-[#999] dark:text-[#6b7280]'>
                      {t('输入')} {model.price}/M
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== 区域4: 快速集成 ==================== */}
          <section className='w-full px-4 py-20 md:py-28'>
            <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start'>
              {/* 左侧：文字描述 */}
              <div className='flex flex-col justify-center'>
                <p className='text-sm font-medium mb-3 text-[#666] dark:text-[#9ca3af]'>
                  {t('快速集成')}
                </p>
                <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-5 text-[#1a1a2e] dark:text-[#ffffff]'>
                  {t('几行代码，即刻接入最强 AI')}
                </h2>
                <p className='text-base leading-relaxed mb-8 text-[#666] dark:text-[#9ca3af]'>
                  {t(
                    '兼容 OpenAI API 格式，只需替换 endpoint 和 API Key，即可无缝切换到我们的统一接口。支持所有主流编程语言和框架。'
                  )}
                </p>
                {/* 三个特点标记 - 横向排列 */}
                <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                  {[
                    t('OpenAI 兼容格式'),
                    t('流式输出支持'),
                    t('Function Calling'),
                  ].map((item, idx) => (
                    <div key={idx} className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-[#10b981] inline-block' />
                      <span className='text-sm text-[#555] dark:text-[#d1d5db]'>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：代码预览面板 */}
              <div className='rounded-xl overflow-hidden bg-[#1e1e2e] dark:bg-[#111111] border border-[#2a2a3a] dark:border-[#262626]'>
                {/* Tab 栏 */}
                <div className='flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] dark:border-[#262626]'>
                  <div className='flex items-center gap-1'>
                    {codeTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveCodeTab(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          activeCodeTab === tab.key
                            ? 'bg-[#3a3a4a] dark:bg-[#262626] text-[#ffffff]'
                            : 'bg-transparent text-[#9ca3af] hover:text-[#d1d5db] hover:bg-[#3a3a4a]/50 dark:hover:bg-[#262626]/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {/* 复制按钮 */}
                  <button
                    onClick={handleCopyCode}
                    className='p-2 rounded-md transition-colors hover:bg-[#3a3a4a] dark:hover:bg-[#262626] text-[#9ca3af]'
                    title={t('复制代码')}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* 代码内容 - 固定高度防止切换Tab时布局跳动 */}
                <div className='p-4 overflow-auto h-[360px] scrollbar-hide'>
                  <pre className='text-sm leading-relaxed whitespace-pre font-mono text-[#d1d5db]'>
                    <code>{codeSamples()[activeCodeTab]}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
