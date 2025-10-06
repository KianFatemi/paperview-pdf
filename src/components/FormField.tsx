import React from 'react';
import type { FormField as FormFieldType, TextFormField, CheckboxFormField, RadioFormField, SelectFormField } from '../types';

interface FormFieldProps {
  field: FormFieldType;
  scale: number;
  onValueChange: (fieldId: string, value: string | boolean | string[]) => void;
}

const FormField: React.FC<FormFieldProps> = ({ field, scale, onValueChange }) => {
  const { rect, type, readOnly } = field;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${rect.x * scale}px`,
    top: `${rect.y * scale}px`,
    width: `${rect.width * scale}px`,
    height: `${rect.height * scale}px`,
    pointerEvents: readOnly ? 'none' : 'auto',
  };

  const handleChange = (value: string | boolean | string[]) => {
    if (!readOnly) {
      onValueChange(field.id, value);
    }
  };

  const renderField = () => {
    switch (type) {
      case 'text': {
        const textField = field as TextFormField;
        return (
          <div style={style} className="form-field-wrapper">
            {textField.multiline ? (
              <textarea
                className="form-field form-field-text form-field-textarea"
                value={textField.value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={textField.placeholder}
                maxLength={textField.maxLength}
                readOnly={readOnly}
                required={field.required}
                disabled={readOnly}
              />
            ) : (
              <input
                type="text"
                className="form-field form-field-text form-field-input"
                value={textField.value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={textField.placeholder}
                maxLength={textField.maxLength}
                readOnly={readOnly}
                required={field.required}
                disabled={readOnly}
              />
            )}
          </div>
        );
      }

      case 'checkbox': {
        const checkboxField = field as CheckboxFormField;
        return (
          <div style={style} className="form-field-wrapper form-field-checkbox-wrapper">
            <input
              type="checkbox"
              className="form-field form-field-checkbox"
              checked={checkboxField.value}
              onChange={(e) => handleChange(e.target.checked)}
              readOnly={readOnly}
              required={field.required}
              disabled={readOnly}
            />
          </div>
        );
      }

      case 'radio': {
        const radioField = field as RadioFormField;
        return (
          <div style={style} className="form-field-wrapper form-field-radio-wrapper">
            <input
              type="radio"
              name={radioField.groupName}
              className="form-field form-field-radio"
              checked={radioField.value === radioField.exportValue}
              onChange={(e) => {
                if (e.target.checked) {
                  handleChange(radioField.exportValue);
                }
              }}
              readOnly={readOnly}
              required={field.required}
              disabled={readOnly}
            />
          </div>
        );
      }

      case 'select': {
        const selectField = field as SelectFormField;
        const selectValue = selectField.multiSelect 
          ? (Array.isArray(selectField.value) ? selectField.value : [])
          : (Array.isArray(selectField.value) ? '' : selectField.value);
        
        return (
          <div style={style} className="form-field-wrapper">
            <select
              className="form-field form-field-select"
              value={selectValue}
              multiple={selectField.multiSelect}
              onChange={(e) => {
                if (selectField.multiSelect) {
                  const selectedOptions = Array.from(e.target.selectedOptions).map(
                    (opt) => opt.value
                  );
                  handleChange(selectedOptions);
                } else {
                  handleChange(e.target.value);
                }
              }}
              disabled={readOnly}
              required={field.required}
            >
              {!selectField.required && !selectField.multiSelect && (
                <option value="">-- Select --</option>
              )}
              {selectField.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.displayValue}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case 'button': {
        return (
          <div style={style} className="form-field-wrapper">
            <button
              className="form-field form-field-button"
              onClick={() => handleChange('clicked')}
              disabled={readOnly}
            >
              {field.value as string}
            </button>
          </div>
        );
      }

      case 'signature': {
        return (
          <div style={style} className="form-field-wrapper form-field-signature-wrapper">
            <div className="form-field form-field-signature">
              {field.value ? (
                <img src={field.value as string} alt="Signature" className="signature-image" />
              ) : (
                <div className="signature-placeholder">Click to sign</div>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return renderField();
};

export default FormField;

