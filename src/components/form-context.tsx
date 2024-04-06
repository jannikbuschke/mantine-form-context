import {
  FormErrors,
  UseFormInput,
  UseFormReturnType,
  useForm,
} from "@mantine/form"
import React from "react"

type FieldPath<P, S> = {
  _PATH_: string & { _BRAND_: P & S }
}
type PathProxy<P, S> = FieldPath<P, S> & { [K in keyof S]: PathProxy<P, S[K]> }
const IdPath = { _PATH_: "" } as FieldPath<any, any>

export function pathProxy<S, P = S>(
  parent: FieldPath<P, S> = IdPath as any,
): PathProxy<P, S> {
  return new Proxy(parent as any, {
    get(target: any, key: any) {
      if (key in target) return target[key]
      return pathProxy<any, any>({
        _PATH_: `${parent._PATH_ && parent._PATH_ + "."}${key}`,
      } as any)
    },
  })
}

type Props<Values> = {
  handleValidationFailure?:
    | ((
        errors: FormErrors,
        values: Values,
        event: React.FormEvent<HTMLFormElement> | undefined,
      ) => void)
    | undefined
  onSubmit: (
    values: Values,
    event: React.FormEvent<HTMLFormElement> | undefined,
  ) => void
  children:
    | React.ReactNode
    | React.ReactNode[]
    | ((
        form: UseFormReturnType<Values>,
        _: PathProxy<Values, Values>,
      ) => React.ReactNode | React.ReactNode[])
} & UseFormInput<Values>

const Context = React.createContext<
  UseFormReturnType<any, (values: any) => any>
>(null as any)

export function useFormContext<Values>() {
  const ctx = React.useContext(Context) as UseFormReturnType<Values>
  if (!ctx) throw new Error("useFormContext must be used inside Form component")
  return ctx
}

export function Form<T>({
  onSubmit,
  children,
  handleValidationFailure,
  ...rest
}: Props<T>) {
  const _ = pathProxy<T>()
  const form = useForm<T>(rest)
  //  onSubmit(handleSubmit: (values: ReturnType<TransformValues>, event: React.FormEvent<HTMLFormElement> | undefined) => void,
  //  handleValidationFailure?: ((errors: FormErrors, values: T, event: React.FormEvent<HTMLFormElement> | undefined) => void) | undefined): (event?: React.FormEvent<HTMLFormElement> | undefined) => void
  return (
    <Context.Provider value={form}>
      <form
        onSubmit={form.onSubmit(
          (values, e) => onSubmit(values, e),
          handleValidationFailure,
        )}
      >
        {typeof children === "function" ? children(form, _) : children}
      </form>
    </Context.Provider>
  )
}
