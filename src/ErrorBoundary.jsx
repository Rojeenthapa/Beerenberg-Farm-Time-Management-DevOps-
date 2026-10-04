import React from "react";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "React page error:",
      error
    );

    console.error(
      "React component details:",
      errorInfo
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="page-error">
          <div className="page-error-card">
            <h1>
              This page could not be loaded
            </h1>

            <p>
              {this.state.error?.message ||
                "An unexpected error occurred."}
            </p>

            <button
              type="button"
              onClick={this.handleReload}
            >
              Reload Page
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}


export default ErrorBoundary;