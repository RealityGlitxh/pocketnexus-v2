import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  EmptyState,
  ErrorState,
  SearchField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  ToastProvider,
  useToast,
} from '../index';

describe('Button', () => {
  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as its child with asChild', () => {
    render(
      <Button asChild>
        <a href="/decks">Decks</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Decks' })).toHaveAttribute('href', '/decks');
  });
});

describe('TextField', () => {
  it('associates label, hint and error with the input', () => {
    const { rerender } = render(<TextField label="Email" hint="We never share it." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAccessibleDescription('We never share it.');

    rerender(<TextField label="Email" hint="We never share it." error="Enter a valid email." />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
  });
});

describe('SearchField', () => {
  function Harness() {
    const [value, setValue] = useState('');
    return <SearchField label="Search cards" value={value} onValueChange={setValue} />;
  }

  it('updates and clears', async () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search cards' });
    await userEvent.type(input, 'Pikachu');
    expect(input).toHaveValue('Pikachu');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
  });
});

describe('Dialog', () => {
  it('opens with an accessible title and closes on Escape', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent title="Delete deck" description="This cannot be undone.">
          <p>Body</p>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete deck' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('switches panels with the keyboard', async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Views">
          <TabsTrigger value="a">Alpha</TabsTrigger>
          <TabsTrigger value="b">Beta</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');
  });
});

describe('States', () => {
  it('EmptyState and ErrorState expose their titles; ErrorState is an alert', () => {
    render(
      <>
        <EmptyState title="No decks yet" description="Build your first deck." />
        <ErrorState title="Could not load" />
      </>,
    );
    expect(screen.getByRole('heading', { name: 'No decks yet' })).toBeInTheDocument();
    expect(within(screen.getByRole('alert')).getByText('Could not load')).toBeInTheDocument();
  });
});

describe('Toast', () => {
  function Trigger() {
    const { toast } = useToast();
    return (
      <Button
        onClick={() => {
          toast({ title: 'Deck saved', tone: 'success' });
        }}
      >
        Notify
      </Button>
    );
  }

  it('shows a dismissible notification', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(await screen.findByText('Deck saved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Deck saved')).not.toBeInTheDocument();
  });

  it('throws a clear error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
