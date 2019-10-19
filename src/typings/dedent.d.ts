declare module '@timhall/dedent/macro' {
  export default function dedent(
    strings: string | string[] | TemplateStringsArray,
    ...values: string[]
  ): string;
}
