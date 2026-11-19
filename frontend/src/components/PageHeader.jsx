// Page heading in the template's style: brush-script line, bold caps title, quiet subtitle.
const PageHeader = ({ kicker, title, subtitle, children }) => (
  <header className="page-hero">
    {kicker && <span className="script-line">{kicker}</span>}
    <h1 className="page-title">{title}</h1>
    {subtitle && <p className="page-subtitle">{subtitle}</p>}
    {children}
  </header>
);

export default PageHeader;
