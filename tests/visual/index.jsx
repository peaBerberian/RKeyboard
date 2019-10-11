import React from 'react';
import ReactDOM from 'react-dom';

const CREATE_OPTIONS = {
  combine: 'boolean',
  propagate: 'boolean',
  reEmit: 'number',
  preventDefault: 'boolean'
};

const LISTEN_OPTION = {
  combine: 'boolean',
  propagate: 'boolean',
  reEmit: 'number'
};

class CreateKeyboardComponent extends React.Component {
  constructor(...args) {
    this.state = {
    };
    super(...args);
  }

  onInput(optionName, optionValue) {
    console.log(optionName, optionValue);
  }

  render() {
    return (
      <InputGroupComponent
        options={CREATE_OPTIONS}
        onInput={this.onInput}
      />
    );
  }
}

/**
 * props:
 *   - className
 *   - onInput: onInput(optionName, optionValue)
 *   - options
 *
 */
class InputGroupComponent extends React.Component {
  constructor(...args) {
    this.state = {
      inputs: []
    };
    super(...args);
  }

  removeInput(id) {
    if (this.state.inputs.length <= 1) {
      // erase value of the first element
      this.setState({
        inputs: [{
          name: void 0,
          type: void 0,
        }]
      });
    } else {
      // remove the wanted input completely
      this.setState({
        inputs: [...this.state.inputs].splice(id, 1);
      });
    }
  }

  inputNameListener(inputId, inputs) {
    const isLastPlaceholder = !!input.text &&
      inputId === this.state.inputs.length;

    return (text) => {
      if (text) {
        inputs[inputId].text = text;
        inputs[inputId].type = this.props.types[text];

        if (isLastPlaceholder) {
          // add input
          inputs.push({
            name: void 0,
            type: void 0
          });
        }

        this.setState({
          inputs
        });
      }
    };
  }

  inputValueListener(inputId, inputs) {
    return (value) => {
      this.props.onInput(this.state.inputs[inputId], value);
    };
  }

  onRemove(inputID) {
    this.removeInput(inputID);
  }

  render() {
    const toto = this.state.inputs.map((input, i) =>
      input.text ?
        <InputAndValueComponent
          name={input.name}
          type={input.type}
          onValueChange={this.inputValueListener(i)}
          onRemove={this.onRemove.bind(this)}
        /> :
        <InputChoiceComponent
          onChange={this.inputNameListener(i)}
          options={this.props.options}
        />
    );
    return (
      <div className={this.props.className}>
        {toto()}
      </div>
    );
  }
}

/**
 * props:
 *   - className
 *   - text
 *   - type
 *   - onValueChange
 *   - onRemove
 */
const InputAndValueComponent = function(props) {
  let input;

  switch (props.type) {
    case 'boolean':
      input = (
        <input
          type='checkbox'
          onChange={props.onValueChange}
        />
      );
      break;
    case 'number':
      input = (
        <input
          type='text'
          onChange={(n) => props.onValueChange(+n)}
        />
      );
      break;
    case 'text':
      input = (
        <input
          type='text'
          onChange={props.onValueChange}
        />
      );
      break;
    default:
      input = null;
  }
  return (
    <div className={'input ' + props.className || ''}>
      <button type="button" onClick={props.onRemove}>-</button>
      <span className={'input-text'}>
        {props.text}
      </span>
      <span className={'input-val'}>
        {input}
      </span>
    </div>
  );
}

/**
 * props:
 *   - className
 *   - onChange
 *   - options
 */
const InputChoiceComponent = (props) =>
  <div className={'input ' + props.className || ''}>
    <InputSelectComponent
      onChange={props.onChange}
      options={props.options}
    />
  </div>;

/**
 * props:
 *   - className
 *   - onChange
 *   - options
 */
const InputSelectComponent = (props) => {
  const options = props.options.map(option =>
    <option value={option} >
      {option}
    </option>
  );

  return (
    <select onChange={props.onChange} className={props.className}>
      options
    </select>
  );
};

ReactDOM.render(<MyComponent />, document.getElementById('main'));
