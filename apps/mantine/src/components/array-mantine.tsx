import { IArrayDefaultProps } from '@zodform/core';
import { Box, Button, Text } from '@mantine/core';

export function ArrayMantine({ children, title, onAdd, onRemove }: IArrayDefaultProps) {
  return (
    <Box
      style={{
        display: 'grid',
        gap: 32
      }}
    >
      {title && <Text size="lg">{title}</Text>}

      {children.map((child, index) => (
        <Box key={index}>
          {child}

          <Button
            onClick={() => {
              onRemove(index);
            }}
            color="gray"
            variant="subtle"
            style={{ marginTop: 16 }}
          >
            Remove
          </Button>
        </Box>
      ))}

      <Button style={{ justifySelf: 'end' }} onClick={onAdd}>
        Add
      </Button>
    </Box>
  );
}
