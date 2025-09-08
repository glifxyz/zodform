import { IObjectDefaultProps } from '@zodform/core';
import { Box, Text } from '@mantine/core';

export function ObjectMantine({ children, title }: IObjectDefaultProps) {
  return (
    <Box>
      {title && <Text style={{ fontWeight: 'bold', fontSize: 'lg', marginBottom: 16 }}>{title}</Text>}

      {children}
    </Box>
  );
}

export function ObjectMantineRows(props: IObjectDefaultProps) {
  return (
    <ObjectMantine {...props}>
      <Box style={{ display: 'flex', gap: 8, '& > *': { flex: 1 } }}>{props.children}</Box>
    </ObjectMantine>
  );
}
