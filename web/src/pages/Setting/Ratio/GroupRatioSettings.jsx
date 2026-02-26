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

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Button,
  Col,
  Form,
  Row,
  Spin,
  Table,
  Tag,
  TagInput,
  Input,
  Space,
  Popconfirm,
  Typography,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GroupRatioSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    GroupRatio: '',
    UserUsableGroups: '',
    GroupGroupRatio: '',
    'group_ratio_setting.group_special_usable_group': '',
    AutoGroups: '',
    DefaultUseAutoGroup: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  // ========== 分组特殊可用分组 可视化配置 辅助逻辑 ==========
  // 新增用户分组规则时的输入值
  const [newGroupName, setNewGroupName] = useState('');

  /**
   * 将 JSON 字符串解析为可视化行数据
   * JSON 格式: {"vip": {"+:premium": "高级分组", "special": "特殊分组", "-:default": "默认分组"}}
   * 返回: [{userGroup: "vip", additions: [{group: "premium", desc: "高级分组"}], removals: [{group: "default", desc: "默认分组"}]}]
   */
  const parseSpecialGroupJSON = useCallback((jsonStr) => {
    if (!jsonStr || jsonStr.trim() === '') return [];
    try {
      const data = JSON.parse(jsonStr);
      return Object.entries(data).map(([userGroup, mapping]) => {
        const additions = [];
        const removals = [];
        Object.entries(mapping || {}).forEach(([key, desc]) => {
          if (key.startsWith('+:')) {
            additions.push({ group: key.slice(2), desc: desc || '' });
          } else if (key.startsWith('-:')) {
            removals.push({ group: key.slice(2), desc: desc || '' });
          } else {
            // 无前缀视为添加
            additions.push({ group: key, desc: desc || '' });
          }
        });
        return { userGroup, additions, removals };
      });
    } catch {
      return [];
    }
  }, []);

  /**
   * 将可视化行数据序列化回 JSON 字符串
   */
  const serializeSpecialGroup = useCallback((rows) => {
    if (!rows || rows.length === 0) return '{}';
    const result = {};
    rows.forEach(({ userGroup, additions, removals }) => {
      const mapping = {};
      (additions || []).forEach(({ group, desc }) => {
        mapping[`+:${group}`] = desc || group;
      });
      (removals || []).forEach(({ group, desc }) => {
        mapping[`-:${group}`] = desc || group;
      });
      result[userGroup] = mapping;
    });
    return JSON.stringify(result, null, 2);
  }, []);

  // 从 inputs 中解析出可视化行数据
  const specialGroupRows = useMemo(
    () =>
      parseSpecialGroupJSON(
        inputs['group_ratio_setting.group_special_usable_group']
      ),
    [
      inputs['group_ratio_setting.group_special_usable_group'],
      parseSpecialGroupJSON,
    ]
  );

  /**
   * 更新可视化行数据并同步写回 inputs
   */
  const updateSpecialGroupRows = useCallback(
    (newRows) => {
      const jsonStr = serializeSpecialGroup(newRows);
      setInputs((prev) => ({
        ...prev,
        'group_ratio_setting.group_special_usable_group': jsonStr,
      }));
      // 同步到表单
      if (refForm.current) {
        refForm.current.setValue(
          'group_ratio_setting.group_special_usable_group',
          jsonStr
        );
      }
    },
    [serializeSpecialGroup]
  );

  // 添加新的用户分组规则行
  const handleAddGroupRule = useCallback(() => {
    if (!newGroupName.trim()) return;
    // 检查是否已存在
    if (specialGroupRows.some((r) => r.userGroup === newGroupName.trim())) {
      showWarning(t('该用户分组规则已存在'));
      return;
    }
    const newRows = [
      ...specialGroupRows,
      { userGroup: newGroupName.trim(), additions: [], removals: [] },
    ];
    updateSpecialGroupRows(newRows);
    setNewGroupName('');
  }, [newGroupName, specialGroupRows, updateSpecialGroupRows, t]);

  // 删除某行用户分组规则
  const handleDeleteGroupRule = useCallback(
    (userGroup) => {
      const newRows = specialGroupRows.filter((r) => r.userGroup !== userGroup);
      updateSpecialGroupRows(newRows);
    },
    [specialGroupRows, updateSpecialGroupRows]
  );

  // 更新某行的「额外可用分组 (+)」
  const handleAdditionsChange = useCallback(
    (userGroup, tags) => {
      const newRows = specialGroupRows.map((r) => {
        if (r.userGroup !== userGroup) return r;
        return {
          ...r,
          additions: tags.map((tag) => {
            // 保留已有的描述信息
            const existing = r.additions.find((a) => a.group === tag);
            return existing || { group: tag, desc: tag };
          }),
        };
      });
      updateSpecialGroupRows(newRows);
    },
    [specialGroupRows, updateSpecialGroupRows]
  );

  // 更新某行的「移除分组 (-)」
  const handleRemovalsChange = useCallback(
    (userGroup, tags) => {
      const newRows = specialGroupRows.map((r) => {
        if (r.userGroup !== userGroup) return r;
        return {
          ...r,
          removals: tags.map((tag) => {
            const existing = r.removals.find((a) => a.group === tag);
            return existing || { group: tag, desc: tag };
          }),
        };
      });
      updateSpecialGroupRows(newRows);
    },
    [specialGroupRows, updateSpecialGroupRows]
  );

  // 可视化表格的列定义
  const specialGroupColumns = useMemo(
    () => [
      {
        title: t('用户分组'),
        dataIndex: 'userGroup',
        width: 150,
        render: (text) => (
          <Tag size='large' color='blue' style={{ fontWeight: 600 }}>
            {text}
          </Tag>
        ),
      },
      {
        title: (
          <span>
            {t('额外可用分组')}{' '}
            <Tag size='small' color='green'>
              +
            </Tag>
          </span>
        ),
        dataIndex: 'additions',
        render: (_, record) => (
          <TagInput
            value={record.additions.map((a) => a.group)}
            placeholder={t('输入分组名后按回车添加')}
            onChange={(tags) => handleAdditionsChange(record.userGroup, tags)}
            style={{ minWidth: 200 }}
            renderTagItem={(value, index, onClose) => (
              <Tag
                key={index}
                color='green'
                size='large'
                closable
                onClose={onClose}
                style={{ margin: '2px' }}
              >
                +:{value}
              </Tag>
            )}
          />
        ),
      },
      {
        title: (
          <span>
            {t('移除分组')}{' '}
            <Tag size='small' color='red'>
              -
            </Tag>
          </span>
        ),
        dataIndex: 'removals',
        render: (_, record) => (
          <TagInput
            value={record.removals.map((a) => a.group)}
            placeholder={t('输入分组名后按回车移除')}
            onChange={(tags) => handleRemovalsChange(record.userGroup, tags)}
            style={{ minWidth: 200 }}
            renderTagItem={(value, index, onClose) => (
              <Tag
                key={index}
                color='red'
                size='large'
                closable
                onClose={onClose}
                style={{ margin: '2px' }}
              >
                -:{value}
              </Tag>
            )}
          />
        ),
      },
      {
        title: t('操作'),
        width: 80,
        align: 'center',
        render: (_, record) => (
          <Popconfirm
            title={t('确定删除该分组规则？')}
            onConfirm={() => handleDeleteGroupRule(record.userGroup)}
          >
            <Button
              icon={<IconDelete />}
              type='danger'
              theme='borderless'
              size='small'
            />
          </Popconfirm>
        ),
      },
    ],
    [t, handleAdditionsChange, handleRemovalsChange, handleDeleteGroupRule]
  );
  // ========== 可视化配置 辅助逻辑结束 ==========

  async function onSubmit() {
    try {
      await refForm.current
        .validate()
        .then(() => {
          const updateArray = compareObjects(inputs, inputsRow);
          if (!updateArray.length)
            return showWarning(t('你似乎并没有修改什么'));

          const requestQueue = updateArray.map((item) => {
            const value =
              typeof inputs[item.key] === 'boolean'
                ? String(inputs[item.key])
                : inputs[item.key];
            return API.put('/api/option/', { key: item.key, value });
          });

          setLoading(true);
          Promise.all(requestQueue)
            .then((res) => {
              if (res.includes(undefined)) {
                return showError(
                  requestQueue.length > 1
                    ? t('部分保存失败，请重试')
                    : t('保存失败')
                );
              }

              for (let i = 0; i < res.length; i++) {
                if (!res[i].data.success) {
                  return showError(res[i].data.message);
                }
              }

              showSuccess(t('保存成功'));
              props.refresh();
            })
            .catch((error) => {
              console.error('Unexpected error:', error);
              showError(t('保存失败，请重试'));
            })
            .finally(() => {
              setLoading(false);
            });
        })
        .catch(() => {
          showError(t('请检查输入'));
        });
    } catch (error) {
      showError(t('请检查输入'));
      console.error(error);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <Form
        values={inputs}
        getFormApi={(formAPI) => (refForm.current = formAPI)}
        style={{ marginBottom: 15 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组倍率')}
              placeholder={t('为一个 JSON 文本，键为分组名称，值为倍率')}
              extraText={t(
                '分组倍率设置，可以在此处新增分组或修改现有分组的倍率，格式为 JSON 字符串，例如：{"vip": 0.5, "test": 1}，表示 vip 分组的倍率为 0.5，test 分组的倍率为 1'
              )}
              field={'GroupRatio'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => verifyJSON(value),
                  message: t('不是合法的 JSON 字符串'),
                },
              ]}
              onChange={(value) => setInputs({ ...inputs, GroupRatio: value })}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('用户可选分组')}
              placeholder={t('为一个 JSON 文本，键为分组名称，值为分组描述')}
              extraText={t(
                '用户新建令牌时可选的分组，格式为 JSON 字符串，例如：{"vip": "VIP 用户", "test": "测试"}，表示用户可以选择 vip 分组和 test 分组'
              )}
              field={'UserUsableGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => verifyJSON(value),
                  message: t('不是合法的 JSON 字符串'),
                },
              ]}
              onChange={(value) =>
                setInputs({ ...inputs, UserUsableGroups: value })
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组特殊倍率')}
              placeholder={t('为一个 JSON 文本')}
              extraText={t(
                '键为分组名称，值为另一个 JSON 对象，键为分组名称，值为该分组的用户的特殊分组倍率，例如：{"vip": {"default": 0.5, "test": 1}}，表示 vip 分组的用户在使用default分组的令牌时倍率为0.5，使用test分组时倍率为1'
              )}
              field={'GroupGroupRatio'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => verifyJSON(value),
                  message: t('不是合法的 JSON 字符串'),
                },
              ]}
              onChange={(value) =>
                setInputs({ ...inputs, GroupGroupRatio: value })
              }
            />
          </Col>
        </Row>
        {/* ========== 分组特殊可用分组 - 可视化配置 ========== */}
        <Row gutter={16}>
          <Col xs={24} sm={22}>
            <div style={{ marginBottom: 24 }}>
              <Typography.Title heading={6} style={{ marginBottom: 8 }}>
                {t('分组特殊可用分组')}
              </Typography.Title>
              <Typography.Text type='tertiary' size='small'>
                {t(
                  '配置每个用户分组可额外使用或需要移除的令牌分组。绿色标签 (+) 表示添加可用分组，红色标签 (-) 表示移除分组。'
                )}
              </Typography.Text>
              {/* 隐藏的表单字段，用于保持表单验证和数据提交的兼容性 */}
              <Form.TextArea
                field={'group_ratio_setting.group_special_usable_group'}
                noLabel
                style={{ display: 'none' }}
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: t('不是合法的 JSON 字符串'),
                  },
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    'group_ratio_setting.group_special_usable_group': value,
                  })
                }
              />
              <Table
                columns={specialGroupColumns}
                dataSource={specialGroupRows}
                rowKey='userGroup'
                pagination={false}
                size='small'
                empty={
                  <Typography.Text type='tertiary'>
                    {t('暂无分组规则，请在下方添加')}
                  </Typography.Text>
                }
                style={{ marginTop: 12, marginBottom: 12 }}
              />
              {/* 添加新分组规则 */}
              <Space>
                <Input
                  value={newGroupName}
                  onChange={setNewGroupName}
                  placeholder={t('输入用户分组名称')}
                  onEnterPress={handleAddGroupRule}
                  style={{ width: 200 }}
                />
                <Button
                  icon={<IconPlus />}
                  theme='light'
                  type='primary'
                  onClick={handleAddGroupRule}
                >
                  {t('添加分组规则')}
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('自动分组auto，从第一个开始选择')}
              placeholder={t('为一个 JSON 文本')}
              field={'AutoGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => {
                    if (!value || value.trim() === '') {
                      return true; // Allow empty values
                    }

                    // First check if it's valid JSON
                    try {
                      const parsed = JSON.parse(value);

                      // Check if it's an array
                      if (!Array.isArray(parsed)) {
                        return false;
                      }

                      // Check if every element is a string
                      return parsed.every((item) => typeof item === 'string');
                    } catch (error) {
                      return false;
                    }
                  },
                  message: t('必须是有效的 JSON 字符串数组，例如：["g1","g2"]'),
                },
              ]}
              onChange={(value) => setInputs({ ...inputs, AutoGroups: value })}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Switch
              label={t(
                '创建令牌默认选择auto分组，初始令牌也将设为auto（否则留空，为用户默认分组）'
              )}
              field={'DefaultUseAutoGroup'}
              onChange={(value) =>
                setInputs({ ...inputs, DefaultUseAutoGroup: value })
              }
            />
          </Col>
        </Row>
      </Form>
      <Button onClick={onSubmit}>{t('保存分组倍率设置')}</Button>
    </Spin>
  );
}
