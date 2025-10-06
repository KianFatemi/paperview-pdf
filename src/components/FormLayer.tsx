import React from 'react';
import FormField from './FormField';
import type { FormField as FormFieldType } from '../types';

interface FormLayerProps {
  fields: FormFieldType[];
  scale: number;
  onFieldChange: (fieldId: string, value: string | boolean | string[]) => void;
}

const FormLayer: React.FC<FormLayerProps> = ({ fields, scale, onFieldChange }) => {
  return (
    <div className="form-layer">
      {fields.map((field) => (
        <FormField
          key={field.id}
          field={field}
          scale={scale}
          onValueChange={onFieldChange}
        />
      ))}
    </div>
  );
};

export default FormLayer;

