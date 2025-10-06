import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFButton } from 'pdf-lib';
import type { FormField, TextFormField, CheckboxFormField, RadioFormField, SelectFormField, ButtonFormField, Rect } from '../types';


export async function extractFormFields(
  page: pdfjsLib.PDFPageProxy,
  pageNumber: number
): Promise<FormField[]> {
  try {
    const annotations = await page.getAnnotations();
    const viewport = page.getViewport({ scale: 1 });
    const fields: FormField[] = [];

    for (const annotation of annotations) {
      if (annotation.subtype !== 'Widget') continue;

      const rect = annotation.rect as number[];
      if (!rect || rect.length !== 4) continue;

      const [x1, y1, x2, y2] = rect;
      const fieldRect: Rect = {
        x: Math.min(x1, x2),
        y: viewport.height - Math.max(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };

      const fieldName = annotation.fieldName || `field_${pageNumber}_${fields.length}`;
      const fieldType = annotation.fieldType?.toLowerCase() || 'text';
      const fieldId = `${fieldName}_${pageNumber}_${fields.length}`;

      if (fieldType === 'tx') {
        const textField: TextFormField = {
          id: fieldId,
          name: fieldName,
          type: 'text',
          page: pageNumber,
          rect: fieldRect,
          value: annotation.fieldValue || '',
          defaultValue: annotation.defaultFieldValue || '',
          required: annotation.required || false,
          readOnly: annotation.readOnly || false,
          multiline: annotation.multiLine || false,
          maxLength: annotation.maxLen || undefined,
          placeholder: annotation.alternativeText || '',
        };
        fields.push(textField);
      } else if (fieldType === 'btn') {
        if (annotation.checkBox) {
          const checkboxField: CheckboxFormField = {
            id: fieldId,
            name: fieldName,
            type: 'checkbox',
            page: pageNumber,
            rect: fieldRect,
            value: annotation.fieldValue === 'Yes' || annotation.fieldValue === 'On',
            defaultValue: annotation.defaultFieldValue === 'Yes' || annotation.defaultFieldValue === 'On',
            required: annotation.required || false,
            readOnly: annotation.readOnly || false,
            exportValue: annotation.exportValue || 'Yes',
          };
          fields.push(checkboxField);
        } else if (annotation.radioButton) {
          const radioField: RadioFormField = {
            id: fieldId,
            name: fieldName,
            type: 'radio',
            page: pageNumber,
            rect: fieldRect,
            value: annotation.fieldValue || '',
            defaultValue: annotation.defaultFieldValue || '',
            required: annotation.required || false,
            readOnly: annotation.readOnly || false,
            groupName: annotation.fieldName || fieldName,
            exportValue: annotation.buttonValue || annotation.exportValue || fieldName,
          };
          fields.push(radioField);
        } else {
          const buttonField: ButtonFormField = {
            id: fieldId,
            name: fieldName,
            type: 'button',
            page: pageNumber,
            rect: fieldRect,
            value: annotation.fieldValue || annotation.alternativeText || 'Button',
            required: false,
            readOnly: annotation.readOnly || false,
            buttonType: 'push',
          };
          fields.push(buttonField);
        }
      } else if (fieldType === 'ch') {
        // Choice field (dropdown or listbox)
        const options = (annotation.options || []).map((opt: any) => ({
          value: opt.exportValue || opt.displayValue || opt,
          displayValue: opt.displayValue || opt.exportValue || opt,
        }));

        const selectField: SelectFormField = {
          id: fieldId,
          name: fieldName,
          type: 'select',
          page: pageNumber,
          rect: fieldRect,
          value: annotation.fieldValue || (annotation.multiSelect ? [] : ''),
          defaultValue: annotation.defaultFieldValue || (annotation.multiSelect ? [] : ''),
          required: annotation.required || false,
          readOnly: annotation.readOnly || false,
          options,
          multiSelect: annotation.multiSelect || false,
        };
        fields.push(selectField);
      }
    }

    return fields;
  } catch (error) {
    console.error('Error extracting form fields:', error);
    return [];
  }
}


export async function extractAllFormFields(
  pdfDocument: pdfjsLib.PDFDocumentProxy
): Promise<FormField[]> {
  const allFields: FormField[] = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const pageFields = await extractFormFields(page, pageNum);
    allFields.push(...pageFields);
  }

  return allFields;
}


export async function saveFilledForm(
  originalPdfData: Uint8Array,
  formFields: FormField[]
): Promise<Uint8Array> {
  try {
    
    const pdfDoc = await PDFDocument.load(originalPdfData);
    const form = pdfDoc.getForm();

    const pdfFields = form.getFields();

    const fieldsByName = new Map<string, FormField[]>();
    formFields.forEach(field => {
      const existing = fieldsByName.get(field.name) || [];
      existing.push(field);
      fieldsByName.set(field.name, existing);
    });
    
    let setCount = 0;
    for (const pdfField of pdfFields) {
      const fieldName = pdfField.getName();
      const userFields = fieldsByName.get(fieldName);

      if (!userFields || userFields.length === 0) continue;

      const userField = userFields[0];

      try {
        if (userField.type === 'text') {
          if (pdfField instanceof PDFTextField) {
            pdfField.setText(userField.value as string);
            setCount++;
          }
        } else if (userField.type === 'checkbox') {
          if (pdfField instanceof PDFCheckBox) {
            if (userField.value === true) {
              pdfField.check();
            } else {
              pdfField.uncheck();
            }
            setCount++;
          }
        } else if (userField.type === 'radio') {
          if (pdfField instanceof PDFRadioGroup) {
            const radioField = userField as RadioFormField;
            if (radioField.value) {
              pdfField.select(radioField.value);
              setCount++;
            }
          }
        } else if (userField.type === 'select') {
          if (pdfField instanceof PDFDropdown) {
            const selectField = userField as SelectFormField;
            const value = Array.isArray(selectField.value) 
              ? (selectField.value.length > 0 ? selectField.value[0] : '')
              : selectField.value;
            
            if (value) {
              pdfField.select(value);
              setCount++;
            }
          }
        }
      } catch (fieldError) {
      }
    }
    

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });
    
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error saving filled form:', error);
    throw new Error('Failed to save filled form');
  }
}

/**
 * Check if a PDF has interactive form fields
 */
export async function hasFormFields(pdfDocument: pdfjsLib.PDFDocumentProxy): Promise<boolean> {
  try {
    for (let pageNum = 1; pageNum <= Math.min(pdfDocument.numPages, 10); pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const annotations = await page.getAnnotations();
      
      const hasWidgets = annotations.some(
        (annotation) => annotation.subtype === 'Widget'
      );
      
      if (hasWidgets) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking for form fields:', error);
    return false;
  }
}

/**
 * Validate form fields (check required fields are filled)
 */
export function validateFormFields(formFields: FormField[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of formFields) {
    if (field.required && !field.readOnly) {
      if (field.type === 'checkbox') {
        if (!(field.value as boolean)) {
          errors.push(`${field.name} is required`);
        }
      } else if (field.type === 'select') {
        const value = field.value;
        if (Array.isArray(value) ? value.length === 0 : !value) {
          errors.push(`${field.name} is required`);
        }
      } else {
        if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
          errors.push(`${field.name} is required`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

