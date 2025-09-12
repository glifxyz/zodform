/* eslint-disable react-hooks/rules-of-hooks -- false positive */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { EnumDefault } from '../components/default/enum-default';
import { Form, type FormUiSchema, useForm } from '../core/form';

const meta: Meta<typeof Form> = {
  component: Form,
  args: {},
  argTypes: {}
  // render: (args) => <StatefulTemplate {...args} />,
};

export default meta;

type Story = StoryObj<typeof Form>;

export const ColourSpaces: Story = {
  render: () => {
    // const [liveValidate, setLiveValidate] = useState(false);

    const schema = useMemo(
      () =>
        z.discriminatedUnion('space', [
          z.object({
            space: z.literal('rgb'),
            data: z.object({
              red: z.number().min(0).max(255).nullable(),
              green: z.number().min(0).max(255),
              blue: z.number().min(0).max(255)
            })
          }),
          z.object({
            space: z.literal('hsl'),
            data: z.object({
              hue: z.number().min(0).max(360),
              saturation: z.number().min(0).max(100),
              lightness: z.number().min(0).max(100)
            })
          }),
          z.object({
            space: z.literal('cmyk'),
            data: z.object({
              cyan: z.number().min(0).max(100),
              magenta: z.number().min(0).max(100),
              yellow: z.number().min(0).max(100),
              black: z.number().min(0).max(100)
            })
          })
        ]),
      []
    );

    const [uiSchema] = useState<FormUiSchema<typeof schema>>(() => ({
      discriminator: {
        label: 'Colour space'
      },
      elements: {
        cmyk: {
          ui: {
            optionLabel: 'CMYK (Cyan, Magenta, Yellow, Black)'
          }
        },
        hsl: {
          ui: {
            optionLabel: 'HSL (Hue, Saturation, Lightness)'
          }
        },
        rgb: {
          ui: {
            optionLabel: 'RGB (Red, Green, Blue)'
          }
        }
      }
    }));

    return (
      <div
        style={{
          maxWidth: 500,
          margin: 'auto'
        }}
      >
        <Form
          // liveValidate={liveValidate}
          schema={schema}
          uiSchema={uiSchema}
          defaultValues={{
            space: 'rgb',
            data: {
              red: 0,
              green: 0,
              blue: 0
            }
          }}
          // onErrorsChange={(errors) => {
          //   const isInvalid = Object.keys(errors).length > 0;
          //   setLiveValidate(isInvalid);

          //   action('onErrorsChange')(errors);
          // }}
          onSubmit={(values) => action('submit')(values)}
          onChange={(change) => action('change')(change)}
          showSubmitButton={false}
        />
      </div>
    );
  }
};
