/**
* CascadeSelect Component for uxcore
* @author changming
*
* Copyright 2015-2017, Uxcore Team, Alinw.
* All rights reserved.
*/
import React from 'react';
import classnames from 'classnames';
import Dropdown from 'uxcore-dropdown';
import Select2 from 'uxcore-select2';
import Message from 'uxcore-message';
import i18n from './i18n';
import CascadeSubmenu from './CascadeSubmenu';
import SuperComponent from './SuperComponent';

import { find, getArrayLeafItemContains, deepCopy, getOptions } from './util';

class CascadeSelect extends SuperComponent {
  constructor(props) {
    super(props);
    let { value } = props;
    const { defaultValue } = props;
    const selectedOptions = this.getSelectedOptions(props);

    if (selectedOptions && selectedOptions.length) {
      value = selectedOptions.map(item => item.value);
    }

    this.state = {
      displayValue: value || defaultValue || [],
      value: value || defaultValue || [],
      selectedOptions,
      inputValue: null,
      searchResult: null,
    };

    // 兼容老版本的locale code
    const { locale } = props;
    if (locale === 'zh_CN') {
      this.locale = 'zh-cn';
    } else if (locale === 'en_US') {
      this.locale = 'en-us';
    } else {
      this.locale = locale;
    }

    this.getSelectPlaceholder = props.getSelectPlaceholder ||
      function getSelectPlaceholder() { return i18n[this.locale].placeholder; };
  }

  saveRef(refName) {
    const me = this;
    return (c) => {
      me[refName] = c;
    };
  }

  getSelectedOptions(props) {
    let selectedOptions = [];
    const { options, value, defaultValue } = props;
    const theValue = value || defaultValue;
    if (theValue && theValue.length > 1) {
      let renderArr = null;
      let prevSelected = null;
      for (let i = 0, l = theValue.length; i < l; i++) {
        if (i === 0) {
          renderArr = options;
        } else {
          renderArr = prevSelected && prevSelected.children;
        }
        prevSelected = find(renderArr, item => item.value === theValue[i]);
        if (renderArr && prevSelected) {
          selectedOptions[i] = prevSelected;
        } else {
          selectedOptions = [];
          break;
        }
      }
    } else if (theValue && theValue.length === 1) {
      selectedOptions = getArrayLeafItemContains(options, theValue);
    }
    return selectedOptions;
  }

  componentWillReceiveProps(nextProps) {
    let { value } = nextProps;
    if (value && deepCopy(value) !== deepCopy(this.props.value)) {
      const selectedOptions = this.getSelectedOptions(nextProps);

      if (selectedOptions && selectedOptions.length) {
        value = selectedOptions.map(item => item.value);
      }

      this.setState({
        displayValue: value,
        value,
        selectedOptions,
      });
    }
  }

  onSubmenuItemClick(key, index, selectedOption, hasChildren) {
    const { value, selectedOptions } = this.state;
    const { onChange, changeOnSelect, mustLeaf } = this.props;
    let hideSubmenu = false;
    const newValue = value.slice(0, index);
    newValue.push(key);
    const newSelectedOptions = selectedOptions.slice(0, index);
    newSelectedOptions.push(selectedOption);
    if (!hasChildren) {
      if (this.props.displayMode === 'dropdown') {
        hideSubmenu = true;
        if (this.wrapper) {
          this.wrapper.click();
        }
      }
    }

    if (onChange) {
      if (this.props.displayMode !== 'dropdown') { // 如果展示风格为复杂风格，则点击OK才进行onChange回调
        this.newValue = newValue;
        this.newSelectedOptions = newSelectedOptions;
      } else {
        onChange(newValue, newSelectedOptions);
      }
    }

    let displayValue = newValue;
    if (this.props.displayMode !== 'dropdown') {
      displayValue = [];
    }

    if (changeOnSelect) {
      this.setState({
        displayValue,
        value: newValue,
        selectedOptions: newSelectedOptions,
        inputValue: null,
      });
    } else if (hideSubmenu) {
      this.setState({
        displayValue,
        value: newValue,
        selectedOptions: newSelectedOptions,
        inputValue: null,
      });
    } else if (mustLeaf && newValue.length >= this.props.cascadeSize) {
      this.setState({
        value: newValue,
        displayValue,
        selectedOptions: newSelectedOptions,
        inputValue: null,
      });
    } else {
      displayValue = [];
      this.setState({
        displayValue,
        value: newValue,
        selectedOptions: newSelectedOptions,
        inputValue: null,
      });
    }
  }

  clearContent(e) {
    e.stopPropagation();
    const { onChange } = this.props;
    this.setState({
      displayValue: [],
      value: [],
      selectedOptions: [],
    });
    if (onChange) {
      onChange([], []);
    }
  }

  onDropDownVisibleChange(visible) {
    const { disabled } = this.props;
    if (!disabled) {
      this.setState({
        showSubMenu: visible,
      });
    }
  }

  renderContent() {
    const {
      className,
      disabled,
      clearable,
      displayMode,
      searchOption,
    } = this.props;

    const { selectedOptions, showSubMenu, displayValue } = this.state;

    let placeholder = this.props.placeholder;
    if (!placeholder) {
      placeholder = i18n[this.locale].placeholder;
    }

    return (
      <div
        ref={this.saveRef('wrapper')}
        className={classnames({
          [this.prefixCls('wrapper')]: true,
          [className]: true,
          [this.prefixCls('disabled')]: disabled,
          [this.prefixCls('clearable')]: !disabled && clearable && displayValue.length > 0,
          [this.prefixCls('focus')]: showSubMenu,
        })}
      >
        <div className={this.prefixCls('text')}>
          <input
            type="text"
            placeholder={placeholder}
            style={{ width: '100%', border: 'none', background: 'transparent' }}
            disabled={disabled}
            readOnly={displayMode !== 'searchAndDropdown'}
            value={
              this.state.inputValue !== null ?
                this.state.inputValue :
                this.props.beforeRender(displayValue, selectedOptions) // TODO: change on select 修正
            }
            onChange={(e) => {
              const keywords = e.target.value;
              if (searchOption) {
                searchOption.doSearch(keywords, (searchResult) => {
                  this.setState({ searchResult });
                });
              }
              this.setState({ inputValue: keywords || null });
            }}
          />
        </div>
        <div
          className={classnames({
            [this.prefixCls('arrow')]: true,
            [this.prefixCls('arrow-reverse')]: showSubMenu,
          })}
        >
          <i className="kuma-icon kuma-icon-triangle-down" />
        </div>
        {
          <div className={this.prefixCls('close-wrap')}>
            <i onClick={this.clearContent.bind(this)} className="kuma-icon kuma-icon-error" />
          </div>
        }
      </div>
    );
  }

  renderSelect2Options(index, options) {
    const { value } = this.state;
    if (options) {
      const opt = getOptions(options, value, index);
      return opt.map((optionItem) => (
        <Select2.Option
          key={optionItem.value}
          value={`${optionItem.value}`}
        >
          {optionItem.label}
        </Select2.Option>
      ));
    }
    return null;
  }

  renderSelect() {
    const { value } = this.state;
    const { cascadeSize, options } = this.props;
    const back = [];
    for (let i = 0; i < cascadeSize; i++) {
      back.push((
        <div
          key={i}
          className={this.prefixCls('select-item-wrap')}
          style={{ width: `${(100 / cascadeSize).toFixed(1)}%` }}
        >
          <Select2
            showSearch={false}
            placeholder={this.getSelectPlaceholder(i)}
            getPopupContainer={this.props.getPopupContainer}
            value={value[i]}
            dropdownMatchSelectWidth={false}
            dropdownStyle={{
              width: this.props.columnWidth,
            }}
            onChange={v => {
              let stateValue = this.state.value;
              let selectedOptions = this.state.selectedOptions;
              if (i === 0) {
                stateValue = [v];
                selectedOptions = options.filter(item => `${item.value}_` === `${v}_`);
              } else {
                stateValue[i] = v;
                const selectedParent = selectedOptions[selectedOptions.length - 1];
                if (selectedParent.children) {
                  selectedOptions.push(
                    selectedParent.children.filter(item => `${item.value}_` === `${v}_`)[0]
                  );
                }
              }
              this.setState({ value: stateValue, selectedOptions }, () => {
                this.props.onChange(stateValue, selectedOptions);
              });
            }}
          >
            {this.renderSelect2Options(i, this.props.options)}
          </Select2>
        </div>
      ));
    }
    return <div className={this.prefixCls('select-wrap')}>{back}</div>;
  }

  /**
   * dropdown 和 searchAndDropdonw 模式下的确认方法
   */
  onConfirmValue() {
    const newValue = this.newValue;
    const newSelectedOptions = this.newSelectedOptions;
    if (this.props.mustLeaf && newValue && newValue.length < this.props.cascadeSize) {
      this.setState({
        displayValue: [],
        value: [],
        selectedOptions: [],
      }, () => {
        if (this.wrapper) {
          this.wrapper.click();
        }
      });
      Message.info(i18n[this.locale].mustLeaf, 3);
    } else if (newValue && newSelectedOptions) {
      this.setState({
        value: newValue,
        displayValue: newValue,
        selectedOptions: newSelectedOptions,
      }, () => {
        if (this.wrapper) {
          this.wrapper.click();
        }
      });
      delete this.newValue;
      delete this.newSelectedOptions;
      this.props.onChange(newValue, newSelectedOptions);
    } else {
      if (this.wrapper) {
        this.wrapper.click();
      }
    }
  }

  render() {
    if (this.props.displayMode === 'select') {
      return this.renderSelect();
    }

    const {
      options,
      disabled,
      prefixCls,
      expandTrigger,
      cascadeSize,
      getPopupContainer,
      columnWidth,
    } = this.props;
    const { value } = this.state;
    if (disabled) {
      return this.renderContent();
    }
    let submenu = (
      <div
        className={this.prefixCls('submenu-empty')}
        style={columnWidth ? { width: columnWidth * this.props.cascadeSize } : null}
      />
    );

    if (options.length && !disabled) {
      submenu = (
        <CascadeSubmenu
          prefixCls={prefixCls}
          onItemClick={this.onSubmenuItemClick.bind(this)}
          options={options}
          value={value}
          expandTrigger={expandTrigger}
          cascadeSize={cascadeSize}
          locale={this.locale}
          displayMode={this.props.displayMode}
          onOkButtonClick={this.onConfirmValue.bind(this)}
          columnWidth={this.props.columnWidth}
        />
      );
    }

    // 当 focus 并且输入自定义的值，则请求 RPC，然后渲染 RPC 返回值到 submenu 中
    if (this.state.searchResult && this.state.inputValue) {
      submenu = (
        <div className="kuma-dropdown-menu-submenu">
          {
            this.state.searchResult.map(item =>
              <div
                key={item.value}
                onClick={() => {
                  const selectedOptions = this.getSelectedOptions({
                    value: [item.value],
                    options,
                  });
                  let val = [];
                  if (selectedOptions && selectedOptions.length) {
                    val = selectedOptions.map(i => i.value);
                  }

                  this.setState({
                    inputValue: null,
                    searchResult: null,
                    displayValue: val,
                    value: val,
                    selectedOptions,
                  }, () => {
                    this.props.onChange(val, selectedOptions);
                  });
                }}
                className="kuma-dropdown-menu-select-option"
              >
                {item.label}
              </div>
            )
          }
        </div>
      );
    }

    const props = {};
    if (this.state.inputValue && this.state.searchResult && this.state.searchResult.length > 0) {
      props.visible = true;
    }

    return (
      <Dropdown
        overlay={submenu}
        trigger={['click']}
        onVisibleChange={this.onDropDownVisibleChange.bind(this)}
        getPopupContainer={getPopupContainer}
        {...props}
      >
        {this.renderContent()}
      </Dropdown>
    );
  }

}

CascadeSelect.defaultProps = {
  prefixCls: 'kuma-cascader',
  className: '',
  placeholder: '',
  options: [],
  defaultValue: [],
  value: null,
  onChange: () => { },
  disabled: false,
  clearable: false,
  changeOnSelect: false,
  expandTrigger: 'click',
  cascadeSize: 3,
  beforeRender: (value, selectedOptions) => {
    if (value.length && selectedOptions.length) {
      return selectedOptions.map(o => o && o.label).join(' / ');
    }
    return value.join('/');
  },
  locale: 'zh-cn',
  columnWidth: 120,
  displayMode: 'dropdown',
  getSelectPlaceholder: null,
  mustLeaf: false,
};

// http://facebook.github.io/react/docs/reusable-components.html
CascadeSelect.propTypes = {
  prefixCls: React.PropTypes.string,
  className: React.PropTypes.string,
  options: React.PropTypes.array,
  defaultValue: React.PropTypes.array,
  value: React.PropTypes.array,
  placeholder: React.PropTypes.string,
  onChange: React.PropTypes.func,
  disabled: React.PropTypes.bool,
  clearable: React.PropTypes.bool,
  changeOnSelect: React.PropTypes.bool,
  expandTrigger: React.PropTypes.string,
  beforeRender: React.PropTypes.func,
  locale: React.PropTypes.oneOf(['zh-cn', 'en-us']),
  displayMode: React.PropTypes.oneOf(['dropdown', 'select', 'searchAndDropdown', 'gather']),
  columnWidth: React.PropTypes.number,
  getSelectPlaceholder: React.PropTypes.func,
  mustLeaf: React.PropTypes.bool,
};

CascadeSelect.displayName = 'CascadeSelect';

module.exports = CascadeSelect;
