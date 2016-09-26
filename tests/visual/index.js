import React from 'react';
import ReactDOM from 'react-dom';

const CREATE_OPTIONS = {
  combine: 'boolean',
  propagate: 'boolean',
  reEmit: 'number',
  preventDefault: 'boolean'
};

class CreateKeyboardComponent extends React.Component {
  constructor(...args) {
    this.state = {
    };
    super(...args);
  }

  render() {
  }
}

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
        value: void 0
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
            type: void 0,
            value: void 0
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
      inputs[inputId].value = value;
      this.setState({ inputs });
      this.props.onNewInput(inputs);
    };
  }

  onRemove(inputID) {
    this.removeInput(inputID);
  }

  render() {
    const toto = return this.state.inputs.map((input, i) => {
      <InputComponent
        name={this.props.name}
        type={this.props.type}
        onNameChange={this.inputNameListener(i)}
        onValueChange={this.inputValueListener(i)}
        onRemove={this.onRemove.bind(this)}
      />
    });
    return (
      <div className={className}>
        {toto()}
      </div>
    );
  }
}

const InputComponent = (props) => {
  let input;

  switch (props.type) {
    case 'boolean':
      return <input type="checkbox" id="cbox2">;
      break;
    case 'number':
      break;
    case 'checkbox':
      break;
    default:
      input = null;
  }
  return (
    <div className={'input ' + props.className || ''}>
      <span className={'input-text'}>
        props.name
      </span>
      <span className={'input-val'}>
        {input}     
      </span>
    </div>
  );
}
