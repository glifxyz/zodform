/* eslint-disable react-hooks/rules-of-hooks -- false positive */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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

export const SimpleArray: Story = {
  render: () => {
    const [liveValidate, setLiveValidate] = useState(false);

    const [schema] = useState(() =>
      z.object({
        people: z
          .array(
            z.object({
              firstName: z.string().min(1, 'First name is required'),
              lastName: z.string().min(1, 'Last name is required')
            })
          )
          .min(1, 'Please add at least one person')
          .optional()
      })
    );

    const [uiSchema] = useState<FormUiSchema<typeof schema>>(() => ({
      people: {
        element: {
          ui: {
            Layout: ({ children }) => {
              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {children.firstName} {children.lastName}
                  </div>
                </div>
              );
            }
          },
          firstName: {
            // label: 'First name'
          },
          lastName: {
            // label: 'Last name'
            cond: () => false
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
          liveValidate={liveValidate}
          schema={schema}
          uiSchema={uiSchema}
          onErrorsChange={(errors) => {
            const isInvalid = Object.keys(errors).length > 0;
            setLiveValidate(isInvalid);

            action('onErrorsChange')(errors);
          }}
          onSubmit={(values) => action('submit')(values)}
          onChange={(change) => action('change')(change)}
        >
          {() => {
            return <button type="submit">Submit</button>;
          }}
        </Form>
      </div>
    );
  }
};

export const EnumVsNativeEnum: Story = {
  render: () => {
    const [liveValidate, setLiveValidate] = useState(false);

    const [schema] = useState(() =>
      z.object({
        someEnum: z.enum(['option1', 'option2', 'option3'] as const),
        someNativeEnum: z.nativeEnum({ A: 'A', B: 'B', C: 'C' })
      })
    );

    const [uiSchema] = useState<FormUiSchema<typeof schema>>(() => ({
      someEnum: {
        label: 'Some enum',
        optionLabels: {
          option1: 'Option 1',
          option2: 'Option 2',
          option3: 'Option 3'
        }
      },
      someNativeEnum: {
        label: 'Some native enum',
        optionLabels: {
          A: 'Option A',
          B: 'Option B',
          C: 'Option C'
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
          liveValidate={liveValidate}
          schema={schema}
          uiSchema={uiSchema}
          onErrorsChange={(errors) => {
            const isInvalid = Object.keys(errors).length > 0;
            setLiveValidate(isInvalid);

            action('onErrorsChange')(errors);
          }}
          onSubmit={(values) => action('submit')(values)}
          onChange={(change) => action('change')(change)}
        >
          {() => {
            return <button type="submit">Submit</button>;
          }}
        </Form>
      </div>
    );
  }
};

export const ConferenceRegistration: Story = {
  render: () => {
    const [liveValidate, setLiveValidate] = useState(false);

    const [schema] = useState(() =>
      z.object({
        people: z
          .array(
            z.object({
              firstName: z.string().min(1, 'First name is required'),
              lastName: z.string().min(1, 'Last name is required'),
              email: z.string().email().describe('myname@example.com'),
              phoneNumber: z.string().describe('e.g. "+1 555 555 5555"')
            })
          )
          .min(1, 'Please add at least one person')
          .optional(),

        products: z.array(z.enum(['tShirt', 'coffeeCup'] as const)).min(1, 'Please select a product'),
        amount: z
          .enum(['25000', '50000'] as const)
          .transform((x) => parseInt(x))
          .describe('SEK')
          .default('25000' as const),

        paymentMethod: z
          .enum(['creditCard', 'payPal'] as const)
          .optional()
          .describe('A method'),

        paypalNumber: z.string().optional(),

        isAccepting: z.boolean(),
        age: z.number(),
        future: z.date()
      })
    );

    const [uiSchema] = useState<FormUiSchema<typeof schema>>(() => ({
      people: {
        element: {
          ui: {
            title: 'Attendee',
            Layout: ({ children, value }) => {
              const form = useForm<typeof schema>();

              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      form.update((old) => {
                        if (!old.people) {
                          return;
                        }

                        const [person] = old.people;

                        if (!person) {
                          return;
                        }

                        person.firstName = 'John';
                        person.lastName = 'Doe';
                      });
                    }}
                  >
                    Do
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {children.firstName} {children.lastName}
                  </div>
                  {children.email} {children.phoneNumber}
                  <div>
                    Who? {form.value.amount} {value.lastName}
                  </div>
                </div>
              );
            }
          },
          firstName: {
            label: 'First name'
          },
          lastName: {
            label: 'Last name'
          },
          email: {
            label: 'Email'
          },
          phoneNumber: {
            label: 'Phone number'
          }
        }
      },
      products: {
        label: 'Products',
        optionLabels: {
          coffeeCup: 'Coffee cup',
          tShirt: 'T-shirt'
        }
      },
      paymentMethod: {
        component: EnumDefault,
        label: 'Payment method',
        optionLabels: {
          creditCard: '💳 Credit card',
          payPal: '🐧 PayPal'
        }
      },
      paypalNumber: {
        label: 'PayPal number',
        cond: (formData) => formData.paymentMethod === 'payPal'
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
          liveValidate={liveValidate}
          title={<h1>Conference registration</h1>}
          schema={schema}
          uiSchema={uiSchema}
          onErrorsChange={(errors) => {
            const isInvalid = Object.keys(errors).length > 0;
            setLiveValidate(isInvalid);

            action('errorsChange')(errors);
          }}
          onSubmit={(values) => action('submit')(values)}
          onChange={(change) => action('change')(change)}
        >
          {() => {
            return <button type="submit">Submit</button>;
          }}
        </Form>
      </div>
    );
  }
};

export const Register: Story = {
  render: () => {
    const [schema] = useState(() =>
      z
        .object({
          email: z.string().email(),
          password: z.string(),
          confirmPassword: z.string(),
          birthDate: z.date()
        })
        .refine(
          (data) => {
            return data.password === data.confirmPassword;
          },
          {
            message: 'Passwords do not match'
          }
        )
    );

    return (
      <div
        style={{
          width: 500,
          margin: 'auto'
        }}
      >
        <Form
          uiSchema={{
            birthDate: {
              label: 'Birth date'
            }
          }}
          liveValidate={false}
          schema={schema}
          onSubmit={(values) => console.log('submit')}
          onChange={(updater) => console.log('change')}
        >
          {({ errors }) => {
            return (
              <>
                {errors.length > 0 && (
                  <ul>
                    {errors.map((error) => (
                      <li key={error.path.join('')}>{error.message}</li>
                    ))}
                  </ul>
                )}

                <button type="submit">Submit</button>
              </>
            );
          }}
        </Form>
      </div>
    );
  }
};
